<?php
require __DIR__ . '/utils.php';
require __DIR__ . '/db.php';

cors();

$path = route_path();
$method = $_SERVER['REQUEST_METHOD'];

try {

//Health
if ($path === '/' && $method === 'GET') {
    respond(['ok' => true, 'service' => 'php-backend', 'time' => date(DATE_ATOM)]);
}

//Categories
if ($path === '/categories' && $method === 'GET') {
    $stmt = db()->query("SELECT id, name, tax_percent FROM categories ORDER BY id");
    respond($stmt->fetchAll());
}

if ($path === '/categories' && $method === 'POST') {
    $in = json_input();
    if (!isset($in['name'],$in['tax_percent'])) {
        respond(['error'=>'Preencha todos os campos (nome, imposto).'],422);
    }
 
    try {
        $sql = "INSERT INTO categories (name,tax_percent)
                VALUES (:name,:tax)
                RETURNING id, name, tax_percent";
        $stmt = db()->prepare($sql);
        $stmt->execute([
            ':name'=>$in['name'],
            ':tax'=>$in['tax_percent'],
        ]);
        respond($stmt->fetch(),201);
 
    } catch (PDOException $e) {
        if ($e->getCode() === '23505') {
            respond(['error'=>'Já existe uma categoria com este nome.'],409);
        }
        throw $e;
    }
}

if ($method === 'DELETE' && ($params = path_params('/categories/{id}', $path))) {
    $id = $params['id'];
    $usage = db()->prepare("SELECT COUNT(*) FROM products WHERE category_id = :id");
    $usage->execute([':id'=>$id]);
    if ($usage->fetchColumn() > 0) {
        respond(['error'=>'Categoria usada em ao menos 1 produto no momento e não pode ser removida.'],409);
    }
    $del = db()->prepare("DELETE FROM categories WHERE id = :id");
    $del->execute([':id'=>$id]);
    respond(['deleted'=>true]);
}

// Products
if ($path === '/products' && $method === 'GET') {
    $q = db()->query("
        SELECT p.id, p.name, p.qty, p.unit_price,
               c.name AS category_name, c.tax_percent
        FROM products p
        JOIN categories c ON c.id = p.category_id
        ORDER BY p.id
    ");
    respond($q->fetchAll());
}

if ($path === '/products' && $method === 'POST') {
    $in = json_input();
    $required = ['name','qty','unit_price','category_id'];
    foreach ($required as $f) {
        if (!isset($in[$f])) {
            respond(['error'=>"Missing field $f"],422);
        }
    }

    $cat = db()->prepare("SELECT id, tax_percent FROM categories WHERE id = :category_id");
    $cat->execute([':category_id' => $in['category_id']]);
    $category = $cat->fetch();
    
    if (!$category) {
        respond(['error'=>'Categoria inválida'],422);
    }

    try {
        $stmt = db()->prepare("
            INSERT INTO products (name, qty, unit_price, category_id)
            VALUES (:name, :qty, :price, :cat)
            RETURNING id, name, qty, unit_price, category_id
        ");
        
        $stmt->execute([
            ':name' => $in['name'],
            ':qty' => (int)$in['qty'],
            ':price' => (float)$in['unit_price'],
            ':cat' => (int)$in['category_id']
        ]);
        
        $newProduct = $stmt->fetch();
        respond($newProduct, 201);
        
    } catch (PDOException $e) {
        if ($e->getCode() === '23505') {
            respond(['error'=>'Já existe um produto com este código.'],409);
        }
        throw $e;
        respond(['error'=>'Erro ao salvar produto: ' . $e->getMessage()],500);
    }
}

if ($method === 'DELETE' && ($params = path_params('/products/{id}', $path))) {
    $id = $params['id'];
    
    try {
        $del = db()->prepare("DELETE FROM products WHERE id = :id");
        $del->execute([':id' => $id]);
        
        if ($del->rowCount() === 0) {
            respond(['error' => 'Produto não encontrado'], 404);
        }
        
        respond(['deleted' => true]);
        
    } catch (PDOException $e) {
        respond(['error' => 'Erro ao excluir produto: ' . $e->getMessage()], 500);
    }
}

//Sales (Checkout)
if ($path === '/sales' && $method === 'POST') {
    $in = json_input();
    if (!isset($in['items']) || !is_array($in['items']) || count($in['items'])===0) {
        respond(['error'=>'Informe itens para venda'],422);
    }
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $saleStmt = $pdo->query("INSERT INTO sales DEFAULT VALUES RETURNING id");
        $saleId = $saleStmt->fetchColumn();
        $subtotal = 0; $taxTotal = 0; $total = 0;

        $getP = $pdo->prepare("
            SELECT p.id, p.name, p.qty, p.unit_price, c.tax_percent
            FROM products p JOIN categories c ON c.id=p.category_id
            WHERE p.id=:id FOR UPDATE
        ");
        $insertItem = $pdo->prepare("
            INSERT INTO sale_items
            (sale_id, product_id, name, qty, unit_price, tax_percent, tax_amount, line_subtotal, line_total)
            VALUES (:sale_id, :product_id, :name, :qty, :unit_price, :tax_percent, :tax_amount, :line_subtotal, :line_total)
        ");
        $updateStock = $pdo->prepare("UPDATE products SET qty = qty - :q WHERE id = :id");

        foreach ($in['items'] as $it) {
            $pid = (int)$it['product_id']; $q = max(1,(int)$it['qty']);
            $getP->execute([':id'=>$pid]);
            $p = $getP->fetch();
            if (!$p) throw new Exception("Produto inválido: $pid");
            if ($p['qty'] < $q) throw new Exception("Estoque insuficiente para {$p['name']}");

            $lineSubtotal = $p['unit_price'] * $q;
            $lineTax = $lineSubtotal * ($p['tax_percent']/100.0);
            $lineTotal = $lineSubtotal + $lineTax;

            $insertItem->execute([
                ':sale_id'=>$saleId,
                ':product_id'=>$pid,
                ':name'=>$p['name'],
                ':qty'=>$q,
                ':unit_price'=>$p['unit_price'],
                ':tax_percent'=>$p['tax_percent'],
                ':tax_amount'=>$lineTax,
                ':line_subtotal'=>$lineSubtotal,
                ':line_total'=>$lineTotal,
            ]);
            $updateStock->execute([':q'=>$q, ':id'=>$pid]);

            $subtotal += $lineSubtotal;
            $taxTotal += $lineTax;
            $total += $lineTotal;
        }
        $upd = $pdo->prepare("UPDATE sales SET subtotal=:s, tax_total=:t, total=:tt WHERE id=:id");
        $upd->execute([':s'=>$subtotal, ':t'=>$taxTotal, ':tt'=>$total, ':id'=>$saleId]);

        $pdo->commit();
        respond(['id'=>$saleId, 'subtotal'=>$subtotal, 'tax_total'=>$taxTotal, 'total'=>$total], 201);
    } catch (Throwable $e) {
        $pdo->rollBack();
        respond(['error'=>$e->getMessage()], 409);
    }
}

//Sales history
if ($path === '/sales' && $method === 'GET') {
    $sql = "SELECT id, created_at, subtotal, tax_total, total FROM sales ORDER BY id DESC";
    $sales = db()->query($sql)->fetchAll();
    $items = db()->query("
        SELECT si.sale_id, si.name, si.qty, si.unit_price, si.tax_percent, si.tax_amount, si.line_subtotal, si.line_total
        FROM sale_items si ORDER BY si.sale_id DESC, si.id
    ")->fetchAll();

    $bySale = [];
    foreach ($items as $i) {
        $sid = $i['sale_id'];
        $bySale[$sid]['prodsSale'][] = $i['name'];
        $bySale[$sid]['qtsSale'][] = (int)$i['qty'];
        $bySale[$sid]['unitValuesSales'][] = (float)$i['unit_price'];
        $bySale[$sid]['taxProdTotalSales'][] = (float)$i['tax_amount'];
        $bySale[$sid]['prodTotalSales'][] = (float)$i['line_subtotal'];
    }

    foreach ($sales as &$s) {
        $sid = $s['id'];
        $s['prodsSale'] = $bySale[$sid]['prodsSale'] ?? [];
        $s['qtsSale'] = $bySale[$sid]['qtsSale'] ?? [];
        $s['unitValuesSales'] = $bySale[$sid]['unitValuesSales'] ?? [];
        $s['taxProdTotalSales'] = $bySale[$sid]['taxProdTotalSales'] ?? [];
        $s['prodTotalSales'] = $bySale[$sid]['prodTotalSales'] ?? [];
    }
    respond($sales);
}

http_response_code(404);
respond(['error'=>'Not found: '.$method.' '.$path], 404);

} catch (Throwable $e) {
    http_response_code(500);
    respond(['error'=>'Server error','details'=>$e->getMessage()], 500);
}

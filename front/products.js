const arrayCart = JSON.parse(localStorage.getItem("shoppingcart") || '[]');

let products = [];
let categories = [];
let categoriesLoaded = false;
const cb = document.getElementById("cb-categories");

document.getElementById("saveButton").addEventListener("click", () => {addProduct()});

async function loadProducts() {
  let tbody = document.getElementById("productsListBody");
  tbody.innerText = '';
 
  try {
    const products = await fetch("http://localhost/api/products").then(r => r.json());
 
    if (!products || products.length < 1) {
      let tr = tbody.insertRow();
      let td = tr.insertCell();
      td.setAttribute("colspan", "6");
      td.innerText = "Sem produtos para exibir.";
    } else {
      products.forEach(prd => {
        let tr = tbody.insertRow();
 
        let td_id = tr.insertCell();
        let td_name = tr.insertCell();
        let td_qty = tr.insertCell();
        let td_unpc = tr.insertCell();
        let td_ctnm = tr.insertCell();
        let td_actions = tr.insertCell();

        td_id.innerText = prd.id;
        td_name.innerText = prd.name;
        td_qty.innerText = prd.qty;
        td_unpc.innerText = "R$ " + prd.unit_price;
        td_ctnm.innerText = prd.category_name;
 
        let removeButton = document.createElement('button');
        removeButton.setAttribute("class", "tableActionButton");
        removeButton.innerText = "Remover";
        removeButton.addEventListener('click', async () => {
          await removeProduct(prd.id);
        });
 
        td_actions.appendChild(removeButton);
      });
    }
  } catch (err) {
    console.error("Erro ao carregar produtos:", err);
    let tr = tbody.insertRow();
  }
}

async function addProduct() {
  const namepField = document.getElementById("productName");
  let namep = namepField.value.trim();
  const qtyField = document.getElementById("productAmount");
  let qty = qtyField.value.trim();
  const unit_priceField = document.getElementById("productPrice");
  let unit_price = unit_priceField.value.trim();
  let category_id = parseInt(cb.options[cb.selectedIndex].value);
  
  if (!namep || !qty || !unit_price || !category_id || isNaN(category_id)) {
    alert("Por favor, preencha todos os campos obrigatórios (*)");
    return;
  }
  
  if (isNaN(qty) || qty < 0) {
    alert("Quantidade deve ser um número positivo");
    return;
  }
  
  if (isNaN(unit_price) || unit_price <= 0) {
    alert("Valor unitário deve ser um número maior que zero");
    return;
  }

  try {
    console.log("Enviando dados:", { name: namep, qty: parseInt(qty), unit_price: parseFloat(unit_price), category_id });
    
    let res = await fetch("http://localhost/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: namep, 
        qty: parseInt(qty), 
        unit_price: parseFloat(unit_price), 
        category_id 
      })
    });
    
    console.log("Status da resposta:", res.status);
    
    const responseText = await res.text();
    console.log("Resposta completa:", responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error("Resposta não é JSON válido:", responseText);
      alert("Erro inesperado do servidor");
      return;
    }
    
    if (!res.ok) {
      console.error("Erro detalhado:", responseData);
      alert("Erro ao salvar produto: " + (responseData.error || "Erro desconhecido"));
      return;
    }
    
    console.log("Produto salvo:", responseData);
    products.push(responseData);
    
    namepField.value = '';
    qtyField.value = '';
    unit_priceField.value = '';
    cb.selectedIndex = 0;
    
    loadProducts();
    
  } catch (error) {
    console.error("Erro de rede:", error);
    alert("Erro de conexão ao tentar salvar o produto: " + error.message);
  } finally {
    saveButton.textContent = originalText;
    saveButton.disabled = false;
  }
}

async function loadCategoriesList() {
    while (cb.length) {
        cb.remove(0);
    }

    let defaultOpt = document.createElement("option");
    defaultOpt.textContent = "Selecione a categoria";
    defaultOpt.value = "";
    cb.appendChild(defaultOpt);

    const categories = await fetch("http://localhost/api/categories").then(r => r.json());
    try {
      if(!categories || categories.length <1) {
      console.log("Não há categorias para listar.")
      } else {
        categories.forEach(cat => {
        let opt = document.createElement("option");
          opt.textContent = cat.name;
          opt.value = cat.id;
          cb.appendChild(opt);
      })
      }
    } catch (err) {
      console.error("Erro ao carregar a lista de categorias:", err);
    }
}

async function removeProduct(id) {
  if(confirm('Tem certeza que deseja remover o produto?\nEssa ação não pode ser desfeita.')) {
    const isInCart = arrayCart.some(item => item.productId === id);
    if (isInCart) {
        alert("Não é possível remover este produto pois ele está no carrinho de compras.");
        return;
    }
    let res = await fetch(`http://localhost/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      products = products.filter(p => p.id !== id);
      loadProducts();
    } else {
      const err = await res.json();
      alert("Erro ao excluir produto: " + err.error);
    }
  }
}

window.onload = () => {
  loadProducts();
  loadCategoriesList();
    categoriesLoaded = true;
};
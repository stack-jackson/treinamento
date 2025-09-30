const arrayCart = JSON.parse(localStorage.getItem("shoppingcart") || '[]');
const requiredFieldsMessage = "Preencha os campos requeridos!";
 
document.getElementById("saveButton").addEventListener("click", event => {addProductToCart()});
document.getElementById("cancel").addEventListener("click", event => {cancelPurchase()});
document.getElementById("finish").addEventListener("click", event => {finishPurchase()});
 
let productsLoaded = false;
let productsList = [];
 
const cb = document.getElementById("cb-products");
const qtyInput = document.getElementById("storeProductAmount");
const taxPercentage = document.getElementById("taxPercentage");
const unitPrice = document.getElementById("unitPriceCart");
 
let qtyStorVar = "";
let sumTotal = 0;
let sumTaxes = 0;
let selectedProduct = "";
 
window.onload = function() {
    loadShoppingCart();
    loadProductsList();
};
 
async function loadProductsList() {
    if (productsLoaded) return;
    
    try {
        const response = await fetch('http://localhost/api/products');
        if (!response.ok) throw new Error('Erro ao carregar produtos');
        
        productsList = await response.json();
        
        while (cb.firstChild) {
            cb.removeChild(cb.firstChild);
        }
 
        let defaultOpt = document.createElement("option");
        defaultOpt.textContent = "Selecione o produto";
        defaultOpt.value = "";
        cb.appendChild(defaultOpt);
        
        for(let i = 0; i < productsList.length; i++) {
            if(productsList[i].qty >0){
                let prodName = productsList[i].name;
                let opt = document.createElement("option");
                opt.textContent = prodName;
                opt.value = i;
    
                cb.appendChild(opt);
            }
        }
        productsLoaded = true;
        
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar lista de produtos');
    }
}
 
function loadShoppingCart() {
    let tbody = document.getElementById("shoppingCartListBody");
    tbody.innerText = '';
 
    if(arrayCart.length < 1) {
        let tr = tbody.insertRow();
        let td = tr.insertCell();
        td.setAttribute("colspan", "6");
        td.innerText = "Seu carrinho de compras está vazio.";
    } else {
        for(let i = 0; i < arrayCart.length; i++) {
            let tr = tbody.insertRow();
 
            let td_nameProd = tr.insertCell();
            let td_unitPrice = tr.insertCell();
            let td_qty = tr.insertCell();
            let td_tax = tr.insertCell();
            let td_subTotal = tr.insertCell();
            let td_actions = tr.insertCell();
            
            td_nameProd.innerText = arrayCart[i].nameProdCart;
            td_unitPrice.innerText = formatCurrency(arrayCart[i].unitPriceCart);
            td_qty.innerText = arrayCart[i].qtyCart;
            td_tax.innerText = formatCurrency(arrayCart[i].taxAmountCart);
            td_subTotal.innerText = formatCurrency(arrayCart[i].total);
 
            let removeButton = document.createElement('button');
            let removeButtonText = document.createTextNode("Remover");
            removeButton.setAttribute("class", "tableActionButton");
            removeButton.addEventListener('click', event => {
                removeProductFromCart(i);
            })
 
            td_actions.appendChild(removeButton);
            removeButton.appendChild(removeButtonText);
            calcTaxes();
            calcTotal();
        }
    }
}
 
function removeProductFromCart(i) {
    if(confirm("Tem certeza que deseja remover o produto " + arrayCart[i].nameProdCart + " do carrinho?")) {
        arrayCart.splice(i, 1);
        localStorage.setItem("shoppingcart", JSON.stringify(arrayCart));
        loadShoppingCart();
        calcTaxes();
        calcTotal();
    }
}
 
cb.addEventListener("change", () => {
    let selectValue = parseInt(cb.value);
    if (!isNaN(selectValue) && selectValue >= 0 && selectValue < productsList.length) {
        selectedProduct = productsList[selectValue];
        taxPercentage.value = parseFloat(selectedProduct.tax_percent || 0).toFixed(2);
        unitPrice.value = formatCurrency(selectedProduct.unit_price);
        qtyStorVar = selectedProduct.qty;
        qtyInput.setAttribute("placeholder", "Em estoque: " + qtyStorVar);
        /*qtyInput.setAttribute("max", parseInt(qtyStorVar));*/
        if (qtyStorVar <1) {
            alert("Este produto não possui mais unidades disponíveis no estoque");
            taxPercentage.value = "";
            unitPrice.value = "";
            qtyInput.setAttribute("placeholder", "");
            qtyInput.removeAttribute("max");
        }
    } else {
        taxPercentage.value = "";
        unitPrice.value = "";
        qtyInput.setAttribute("placeholder", "");
        qtyInput.removeAttribute("max");
    }
});

qtyInput.addEventListener("change", () => {
    if (qtyInput.value > qtyStorVar) {
        alert("Quantidade informada superior à disponível no estoque.");
        qtyInput.value = "";
    }
});
 
async function finishPurchase() {
    if (!confirm("Finalizar sua compra agora?")) return;
    
    if (arrayCart.length === 0) {
        alert("Carrinho vazio! Adicione produtos antes de finalizar.");
        return;
    }
 
    try {
        const saleItems = arrayCart.map(item => ({
            product_id: item.productId,
            qty: item.qtyCart
        }));
 
        const response = await fetch('http://localhost/api/sales', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ items: saleItems })
        });
 
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao finalizar compra');
        }
 
        const saleData = await response.json();
        
        arrayCart.forEach(cartItem => {
            const productIndex = parseInt(cartItem.indexProdCart);
            if (!isNaN(productIndex) && productIndex >= 0 && productIndex < productsList.length) {
                productsList[productIndex].qty -= cartItem.qtyCart;
            }
        });
 
        clearShoppingCart();
        //alert(`Compra finalizada com sucesso! ID: ${saleData.id}\n\nConsulte no Histórico de vendas ;)`);
        window.location.href = "/front/history.html";
        
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao finalizar compra: ' + error.message);
    }
}
 
function cancelPurchase() {
    if (confirm("Tem certeza que deseja cancelar a compra? Seu carrinho de compras será esvaziado.")) {
        clearShoppingCart();
    }
}
 
function clearShoppingCart() {
    arrayCart.length = 0;
    localStorage.setItem("shoppingcart", "[]");
    loadShoppingCart();
    document.getElementById("totalTaxInput").value = "";
    document.getElementById("totalPurchaseInput").value = "";
}
 
function formatCurrency(value) {
    return "R$ " + parseFloat(value || 0).toFixed(2).replace('.', ',');
}



function calcTaxes() {
    sumTaxes = arrayCart.reduce((acumulador, item) => acumulador + parseFloat(item.taxAmountCart || 0), 0);
    document.getElementById("totalTaxInput").value = formatCurrency(sumTaxes);
}

function calcTotal() {
    const subtotal = arrayCart.reduce((acumulador, item) => acumulador + parseFloat(item.subTotal || 0), 0);
    sumTotal = subtotal + sumTaxes;
    document.getElementById("totalPurchaseInput").value = formatCurrency(sumTotal);
}

function checkStorage(selectValue, amountValue) {
    if (isNaN(selectValue) || selectValue < 0 || selectValue >= productsList.length) {
        alert("Produto inválido!");
        return true;
    }
    
    const product = productsList[selectValue];
    const amount = parseInt(amountValue);
    
    if (isNaN(amount) || amount <= 0 || amount > parseInt(product.qty)) {
        alert("Quantidade inválida!");
        return true;
    }

    for(let i = 0; i < arrayCart.length; i++) {
        if(selectValue === parseInt(arrayCart[i].indexProdCart)) {
            let sumQtyCart = amount + parseInt(arrayCart[i].qtyCart);
            
            if(sumQtyCart > parseInt(product.qty)) {
                alert(`Ops! A quantidade informada excede o estoque (${product.qty}) do produto ${product.name}.`);
                return true;
            }

            const unitPriceNum = parseFloat(product.unit_price);
            const taxPercent = parseFloat(product.tax_percent);

            const subTotal = sumQtyCart * unitPriceNum;
            const taxAmount = (taxPercent / 100) * subTotal;
            const total = subTotal + taxAmount;

            arrayCart[i] = {
                nameProdCart: product.name,
                indexProdCart: selectValue,
                productId: product.id,
                qtyStorage: product.qty,
                unitPriceCart: unitPriceNum,
                qtyCart: sumQtyCart,
                taxPercentCart: taxPercent,
                taxAmountCart: taxAmount,
                subTotal: subTotal,
                total: total
            };
            
            localStorage.setItem("shoppingcart", JSON.stringify(arrayCart));
            calcTaxes();
            calcTotal();
            
            return true;
        }   
    }
    return false;
}

function addProductToCart() {
    let selectValue = parseInt(cb.value);
    let amountValue = qtyInput.value.trim();
    
    if (isNaN(selectValue) || !amountValue) {
        alert(requiredFieldsMessage);
        return;
    }
    
    if (checkStorage(selectValue, amountValue) === false) {
        const product = productsList[selectValue];
        const amount = parseInt(amountValue);
        const unitPriceNum = parseFloat(product.unit_price);
        const taxPercent = parseFloat(product.tax_percent);
        
        const subTotal = amount * unitPriceNum;
        const taxAmount = (taxPercent / 100) * subTotal;
        const total = subTotal + taxAmount;
        
        arrayCart.push({
            nameProdCart: product.name,
            indexProdCart: selectValue,
            productId: product.id,
            qtyStorage: product.qty,
            unitPriceCart: unitPriceNum,
            qtyCart: amount,
            taxPercentCart: taxPercent,
            taxAmountCart: taxAmount,
            subTotal: subTotal,
            total: total
        });
        
        localStorage.setItem("shoppingcart", JSON.stringify(arrayCart));
        
        calcTaxes();
        calcTotal();
    }
    
    cb.value = "";
    qtyInput.value = "";
    taxPercentage.value = "";
    unitPrice.value = "";
    qtyInput.setAttribute("placeholder", "");
    loadShoppingCart();
}
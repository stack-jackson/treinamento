let salesHistory = [];
let saleItems = [];

async function loadHistory() {
  let tbody = document.getElementById("salesListBody");
  tbody.innerText = '';

  try {
    salesHistory = await fetch("http://localhost/api/sales").then(r => r.json());

    if (!salesHistory || salesHistory.length < 1) {
      let tr = tbody.insertRow();
      let td = tr.insertCell();
      td.setAttribute("colspan", "4");
      td.innerText = "Sem vendas para exibir.";
    } else {
      salesHistory.forEach(sal => {
        let tr = tbody.insertRow();

        let td_id = tr.insertCell();
        let td_tax = tr.insertCell();
        let td_total = tr.insertCell();
        let td_actions = tr.insertCell();

        td_id.innerText = sal.id;
        td_tax.innerText = "R$ " + sal.tax_total;
        td_total.innerText = "R$ " + sal.total;

        let viewButton = document.createElement('button');
        let viewButtonText = document.createTextNode("Ver detalhes");
        viewButton.setAttribute("class", "tableActionButton");
        viewButton.addEventListener('click', () => {
          viewDetails(sal.id);
        });

        td_actions.appendChild(viewButton);
        viewButton.appendChild(viewButtonText);
      });
    }
  } catch (err) {
    console.error("Erro ao carregar o histórico de vendas:", err);
    let tr = tbody.insertRow();
  }
}

function viewDetails(id) {
  console.log(id);
  const pos = salesHistory.findIndex(obj => obj.id === id);
  console.log("VALOR DE POS: "+pos);
  viewDetailsProducts(pos);
    alert(`-------- DETALHES DA VENDA --------\n` +
          `Código: ${salesHistory[pos].id}\n\n` +
          `ITENS` +
          prodsDetailsList +  
          `\n\nTotal de impostos: R$ ${salesHistory[pos].tax_total}\n` +
          `TOTAL DA VENDA: R$ ${salesHistory[pos].total}\n` +
          `-----------------------------------------`);
}

async function viewDetailsProducts(pos) {
    prodsDetailsList = "";
    for (let i = 0; i < salesHistory[pos].prodsSale.length; i++) {
        let prodName = "\n\nProduto: " + salesHistory[pos].prodsSale[i];
        let qtyValue = "\nQuantidade: " + salesHistory[pos].qtsSale[i];
        let unitValue = "\nValor unitário: R$ " + salesHistory[pos].unitValuesSales[i];
        let taxProd = "\nImpostos: R$ " + salesHistory[pos].taxProdTotalSales[i];
        let totalProd = "\nSubtotal: R$" + salesHistory[pos].prodTotalSales[i];

        prodsDetailsList += prodName + qtyValue + unitValue + taxProd + totalProd;
    }
}

window.onload = () => {
  loadHistory();
};
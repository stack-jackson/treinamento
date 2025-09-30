let categories = [];

document.getElementById("saveButton").addEventListener("click", () => {addCategory()});

async function addCategory() {
  const namecField = document.getElementById("categoryName");
  let namec = namecField.value.trim();
  const taxField = document.getElementById("taxPercentage");
  let tax = taxField.value.trim();
  //alert("code: "+code+" | name: "+namec+" | tax: "+tax);

  if (!namec || !tax) {
    alert("Por favor, preencha todos os campos obrigatórios (*)");
    return;
  }

  if (isNaN(tax) ||tax < 0 || tax > 100) {
    alert("Imposto deve ser um valor de 0 a 100");
    return;
  }

  const res = await fetch("http://localhost/api/categories", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: namec, tax_percent: tax })
  });
  if (!res.ok) {
    const err = await res.json();
    alert("Erro ao salvar categoria: " + err.error);
    return;
  }
  const newCat = await res.json();
  categories.push(newCat);
  loadCategories();
}

async function loadCategories() {
  let tbody = document.getElementById("categoriesListBody");
  tbody.innerText = '';
 
  try {
    const categories = await fetch("http://localhost/api/categories").then(r => r.json());
 
    if (!categories || categories.length < 1) {
      let tr = tbody.insertRow();
      let td = tr.insertCell();
      td.setAttribute("colspan", "4");
      td.innerText = "Sem categorias para exibir.";
    } else {
      categories.forEach(cat => {
        let tr = tbody.insertRow();
 
        let td_id = tr.insertCell();
        let td_name = tr.insertCell();
        let td_tax = tr.insertCell();
        let td_actions = tr.insertCell();
 
        td_id.innerText = cat.id;
        td_name.innerText = cat.name;
        td_tax.innerText = parseFloat(cat.tax_percent || 0).toFixed(2) + "%";
 
        let removeButton = document.createElement('button');
        removeButton.setAttribute("class", "tableActionButton");
        removeButton.innerText = "Remover";
        removeButton.addEventListener('click', async () => {
          await removeCategory(cat.id);
        });
 
        td_actions.appendChild(removeButton);
      });
    }
  } catch (err) {
    console.error("Erro ao carregar categorias:", err);
    let tr = tbody.insertRow();
  }
}

async function removeCategory(id) {
  if(confirm('Tem certeza que deseja remover a categoria?\nEssa ação não pode ser desfeita.')) {
    const res = await fetch(`http://localhost/api/categories/${id}`, { method: "DELETE" });

    if (res.ok) {
      //categories = categories.filter(c => c.id !== id);
      loadCategories();
    } else {
      const err = await res.json();
      alert("Erro ao excluir categoria: " + err.error);
    }
  }
}

window.onload = () => {
  loadCategories();
};
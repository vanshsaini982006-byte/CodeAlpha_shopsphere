let editingProductId = null;

async function initProductForm() {
  editingProductId = new URLSearchParams(window.location.search).get('id');
  if (editingProductId) {
    document.getElementById('pageHeading').textContent = 'Edit Product';
    document.getElementById('formTitle').textContent = 'Edit Product — ShopSphere Admin';
    document.getElementById('submitProductBtn').textContent = 'Update Product';
    try {
      const { product: p } = await api.get(`/products/${editingProductId}`);
      document.getElementById('fName').value = p.name;
      document.getElementById('fBrand').value = p.brand;
      document.getElementById('fCategory').value = p.category;
      document.getElementById('fSku').value = p.sku || '';
      document.getElementById('fDescription').value = p.description;
      document.getElementById('fPrice').value = p.price;
      document.getElementById('fDiscount').value = p.discount;
      document.getElementById('fStock').value = p.stock;
      document.getElementById('fImages').value = (p.images || []).join('\n');
      document.getElementById('fFeatures').value = (p.features || []).join('\n');
      const specs = p.specifications instanceof Map ? [...p.specifications.entries()] : Object.entries(p.specifications || {});
      document.getElementById('fSpecs').value = specs.map(([k, v]) => `${k}: ${v}`).join('\n');
      document.getElementById('fFeatured').checked = p.featured;
      document.getElementById('fNewArrival').checked = p.isNewArrival;
      document.getElementById('fBestSeller').checked = p.isBestSeller;
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  }
}

document.getElementById('productForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('submitProductBtn');
  btn.disabled = true;

  const images = document.getElementById('fImages').value.split('\n').map((s) => s.trim()).filter(Boolean);
  const features = document.getElementById('fFeatures').value.split('\n').map((s) => s.trim()).filter(Boolean);
  const specLines = document.getElementById('fSpecs').value.split('\n').map((s) => s.trim()).filter(Boolean);
  const specifications = {};
  specLines.forEach((line) => {
    const idx = line.indexOf(':');
    if (idx > -1) specifications[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  });

  if (images.length === 0) {
    showToast('Please provide at least one image URL', 'error');
    btn.disabled = false;
    return;
  }

  const payload = {
    name: document.getElementById('fName').value.trim(),
    brand: document.getElementById('fBrand').value.trim(),
    category: document.getElementById('fCategory').value,
    sku: document.getElementById('fSku').value.trim() || undefined,
    description: document.getElementById('fDescription').value.trim(),
    price: Number(document.getElementById('fPrice').value),
    discount: Number(document.getElementById('fDiscount').value) || 0,
    stock: Number(document.getElementById('fStock').value),
    images,
    features,
    specifications,
    featured: document.getElementById('fFeatured').checked,
    isNewArrival: document.getElementById('fNewArrival').checked,
    isBestSeller: document.getElementById('fBestSeller').checked
  };

  try {
    if (editingProductId) {
      await api.put(`/products/${editingProductId}`, payload);
      showToast('Product updated', 'success');
    } else {
      await api.post('/products', payload);
      showToast('Product created', 'success');
    }
    window.location.href = 'products.html';
  } catch (err) {
    showToast(apiErrorMessage(err), 'error');
    btn.disabled = false;
  }
});

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAdmin()) return;
  renderAdminLayout('products');
  initProductForm();
});

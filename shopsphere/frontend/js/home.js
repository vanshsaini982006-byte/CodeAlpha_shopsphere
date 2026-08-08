document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar('home');
  renderFooter();

  ['featuredGrid', 'bestSellerGrid', 'newArrivalsGrid'].forEach((id) => renderSkeletonGrid(id, 4));

  try {
    const [featuredRes, bestRes, newRes] = await Promise.all([
      api.get('/products?limit=8', { auth: false }),
      api.get('/products?sort=popularity&limit=4', { auth: false }),
      api.get('/products?sort=newest&limit=4', { auth: false })
    ]);

    const featured = featuredRes.products.filter((p) => p.featured).slice(0, 8);
    renderProductGrid('featuredGrid', featured.length ? featured : featuredRes.products.slice(0, 8));
    renderProductGrid('bestSellerGrid', bestRes.products);
    renderProductGrid('newArrivalsGrid', newRes.products);

    await Promise.all([
      markWishlistedCards(document.getElementById('featuredGrid')),
      markWishlistedCards(document.getElementById('bestSellerGrid')),
      markWishlistedCards(document.getElementById('newArrivalsGrid'))
    ]);
  } catch (err) {
    showToast(apiErrorMessage(err), 'error');
  }
});

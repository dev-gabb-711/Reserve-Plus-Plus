/* =====================================================
   Search Bar Navigation
   - Redirects user to the search results page
   - Triggered when pressing "Enter" inside the search input
   ===================================================== */

const labSearch = document.getElementById('labSearch');

if (labSearch) {
  labSearch.addEventListener('keydown', function (event) {

    if (event.key === 'Enter') {
      event.preventDefault();

      const searchQuery = this.value.trim();

      if (!searchQuery) return;

      window.location.href =
        '/search-results?q=' + encodeURIComponent(searchQuery);
    }

  });
}
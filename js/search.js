/* =====================================================
   Search Bar Navigation
   - Redirects user to the search results page
   - Triggered when pressing "Enter" inside the search input
   ===================================================== */

const labSearch = document.getElementById('labSearch');

/**
 * Adds Enter-key listener only if the search bar exists
 * (prevents errors on pages without the input element).
 */
if (labSearch) {
	labSearch.addEventListener('keypress', function (event) {

		// Trigger search only when Enter key is pressed
		if (event.key === 'Enter') {
			const searchQuery = this.value.trim();

			// Prevent navigation if input is empty
			if (searchQuery) {

				// Redirect to search results page with query parameter
				window.location.href =
					'searchresults.html?q=' +
					encodeURIComponent(searchQuery);
			}
		}
	});
}

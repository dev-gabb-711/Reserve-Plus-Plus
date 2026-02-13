// Handle search bar functionality
const labSearch = document.getElementById('labSearch');

if (labSearch) {
	labSearch.addEventListener('keypress', function (event) {
		if (event.key === 'Enter') {
			const searchQuery = this.value.trim();
			if (searchQuery) {
				// Navigate to search results page with the query
				window.location.href = 'searchresults.html?q=' + encodeURIComponent(searchQuery);
			}
		}
	});
}
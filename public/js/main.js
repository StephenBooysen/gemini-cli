document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchResultsContainer = document.getElementById('searchResults');

    if (searchInput && searchResultsContainer) {
        searchInput.addEventListener('input', async (e) => {
            const query = e.target.value.trim();
            searchResultsContainer.innerHTML = ''; // Clear previous results
            // searchResultsContainer.classList.remove('show'); // Hide if previously shown

            if (query.length < 2) { // Don't search for very short strings
                searchResultsContainer.classList.remove('show'); // Hide if query is too short
                return;
            }

            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Search request failed');
                }
                const results = await response.json(); // Expects an array of { path, name, score }

                if (results.length > 0) {
                    const ul = document.createElement('ul');
                    // ul.style.listStyleType = 'none'; // Bootstrap .dropdown-menu and our CSS will handle this
                    // ul.style.paddingLeft = '0';
                    results.forEach(result => {
                        const li = document.createElement('li');
                        const link = document.createElement('a');
                        link.classList.add('dropdown-item'); // Use Bootstrap's dropdown item class for styling consistency
                        link.href = `/view/${result.path.replace(/\\/g, '/')}`;
                        link.textContent = result.name || result.path.split('/').pop().replace('.md', ''); // Improved fallback for name
                        li.appendChild(link);
                        ul.appendChild(li);
                    });
                    searchResultsContainer.appendChild(ul);
                    searchResultsContainer.classList.add('show'); // Show dropdown
                } else {
                    searchResultsContainer.textContent = 'No results found.'; // Consider styling this message or putting it in a list item
                    searchResultsContainer.classList.add('show'); // Show "No results found"
                }
            } catch (error) {
                console.error('Search error:', error);
                const li = document.createElement('li');
                li.classList.add('dropdown-item');
                li.textContent = `Error: ${error.message || 'Search failed.'}`;
                const ul = document.createElement('ul');
                ul.appendChild(li);
                searchResultsContainer.innerHTML = ''; // Clear previous before adding error
                searchResultsContainer.appendChild(ul);
                searchResultsContainer.classList.add('show'); // Show error in dropdown
            }
        });

        // Hide dropdown when clicking outside
        document.addEventListener('click', (event) => {
            const isClickInsideSearchContainer = searchInput.contains(event.target) || searchResultsContainer.contains(event.target);
            if (!isClickInsideSearchContainer) {
                searchResultsContainer.classList.remove('show');
            }
        });

        // Optional: Show on focus if there's text, hide on blur if not clicking on results
        // This can be complex due to the race condition between blur and click on results.
        // The click-outside handler is often sufficient.
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim().length >= 2 && searchResultsContainer.children.length > 0) {
                 // Only show if there's already content (e.g., from a previous search) and input is valid
                searchResultsContainer.classList.add('show');
            }
        });

        // Clear and hide if input is manually cleared by backspacing
        searchInput.addEventListener('keyup', (e) => {
            if (e.target.value.trim().length < 2) {
                searchResultsContainer.innerHTML = '';
                searchResultsContainer.classList.remove('show');
            }
        });
    }

    console.log('Main JavaScript loaded and search initialized.');
});

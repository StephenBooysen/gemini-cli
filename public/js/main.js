document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchResultsContainer = document.getElementById('searchResults');

    if (searchInput && searchResultsContainer) {
        searchInput.addEventListener('input', async (e) => {
            const query = e.target.value.trim();
            searchResultsContainer.innerHTML = ''; // Clear previous results

            if (query.length < 2) { // Don't search for very short strings
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
                    ul.style.listStyleType = 'none'; // Basic styling
                    ul.style.paddingLeft = '0';
                    results.forEach(result => {
                        const li = document.createElement('li');
                        const link = document.createElement('a');
                        // Ensure path separators are URL-friendly (though backend should provide them correctly)
                        link.href = `/view/${result.path.replace(/\\/g, '/')}`;
                        link.textContent = result.name || path.basename(result.path, '.md'); // Display name, fallback to filename
                        // Optionally display score:
                        // link.textContent += ` (Score: ${result.score.toFixed(2)})`;
                        li.appendChild(link);
                        ul.appendChild(li);
                    });
                    searchResultsContainer.appendChild(ul);
                } else {
                    searchResultsContainer.textContent = 'No results found.';
                }
            } catch (error) {
                console.error('Search error:', error);
                searchResultsContainer.textContent = `Error: ${error.message || 'Search failed.'}`;
            }
        });
    }

    console.log('Main JavaScript loaded and search initialized.');
});

/**
 * @file Client-side script for handling search functionality and UI enhancements.
 * @description This script initializes event listeners for the search input to fetch and display
 * search results dynamically. It also handles the display of folder icons for navigation.
 */

document.addEventListener('DOMContentLoaded', () => {
  /**
   * @type {HTMLInputElement|null}
   */
  const searchInput = document.getElementById('searchInput');
  /**
   * @type {HTMLElement|null}
   */
  const searchResultsContainer = document.getElementById('searchResults');

  if (searchInput && searchResultsContainer) {
    searchInput.addEventListener('input', async (e) => {
      const query = e.target.value.trim();
      searchResultsContainer.innerHTML = ''; // Clear previous results

      if (query.length < 2) {
        // Don't search for very short strings
        searchResultsContainer.classList.remove('show'); // Hide if query is too short
        return;
      }

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Search request failed');
        }
        const results = await response.json(); // Expects an array of { path, name, score }

        if (results.length > 0) {
          const ul = document.createElement('ul');
          results.forEach((result) => {
            const li = document.createElement('li');
            const link = document.createElement('a');
            link.classList.add('dropdown-item'); // Use Bootstrap's dropdown item class for styling consistency
            link.href = `/view/${result.path.replace(/\\/g, '/')}`;
            link.textContent =
              result.name || result.path.split('/').pop().replace('.md', ''); // Improved fallback for name
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
      const isClickInsideSearchContainer =
        searchInput.contains(event.target) ||
        searchResultsContainer.contains(event.target);
      if (!isClickInsideSearchContainer) {
        searchResultsContainer.classList.remove('show');
      }
    });

    searchInput.addEventListener('focus', () => {
      if (
        searchInput.value.trim().length >= 2 &&
        searchResultsContainer.children.length > 0
      ) {
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

  // Collapsible navigation folder icons
  const folderToggles = document.querySelectorAll(
    '.navigation-pane .folder-toggle'
  );
  folderToggles.forEach((toggle) => {
    const targetId = toggle.getAttribute('href'); // or getAttribute('data-bs-target')
    if (targetId) {
      const collapseElement = document.querySelector(targetId);
      if (collapseElement) {
        // Event listener for when collapse is shown
        collapseElement.addEventListener('show.bs.collapse', () => {
          const icon = toggle.querySelector('.nav-icon > .bi');
          if (icon) {
            icon.classList.remove('bi-folder');
            icon.classList.add('bi-folder2-open');
          }
        });

        // Event listener for when collapse is hidden
        collapseElement.addEventListener('hide.bs.collapse', () => {
          const icon = toggle.querySelector('.nav-icon > .bi');
          if (icon) {
            icon.classList.remove('bi-folder2-open');
            icon.classList.add('bi-folder');
          }
        });
      }
    }
  });

  console.log('Main JavaScript loaded and search initialized.');
});

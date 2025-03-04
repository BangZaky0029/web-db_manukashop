// DOM Elements
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');
const toggleBtn = document.getElementById('toggleBtn');
const menuItems = document.querySelectorAll('.menu-item');
const pageContent = document.getElementById('pageContent');

// Toggle Sidebar
toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
});

// Mobile Menu Toggle
function handleResponsiveLayout() {
    if (window.innerWidth <= 768) {
        sidebar.classList.add('collapsed');
        mainContent.classList.add('expanded');
        
        // Make sure we only add this listener once
        if (!toggleBtn.hasAttribute('data-mobile-listener')) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('mobile-visible');
            });
            toggleBtn.setAttribute('data-mobile-listener', 'true');
        }
    } else {
        sidebar.classList.remove('mobile-visible');
    }
}

// Run once on page load
handleResponsiveLayout();

// Handle menu item clicks
menuItems.forEach(item => {
    item.addEventListener('click', function(e) {
        // Get the link element
        const link = this.querySelector('.menu-link');
        const href = link.getAttribute('href');
        
        // Only load content if it's not a hash link
        if (href && href !== '#') {
            e.preventDefault();
            
            // Remove active class from all menu items
            menuItems.forEach(menuItem => {
                menuItem.classList.remove('active');
            });
            
            // Add active class to clicked menu item
            this.classList.add('active');
            
            // Update page title in header
            const menuTitle = link.querySelector('span').textContent;
            document.querySelector('.content-header h1').textContent = menuTitle;
            
            // Hide welcome message if it exists
            const welcomeMessage = document.getElementById('welcomeMessage');
            if (welcomeMessage) {
                welcomeMessage.style.display = 'none';
            }
            
            // Load content using fetch
            loadContent(href);
            
            // Close mobile sidebar after click
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('mobile-visible');
            }
        }
    });
});

// Function to load content
function loadContent(url) {
    // Show a loading indicator
    pageContent.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    
    // Get the absolute URL
    const absoluteUrl = getAbsoluteUrl(url);
    
    fetch(absoluteUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load page: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            // Parse the loaded HTML
            const parser = new DOMParser();
            const htmlDoc = parser.parseFromString(data, 'text/html');
            
            // Extract the container content
            const loadedContainer = htmlDoc.querySelector('.container');
            
            if (loadedContainer) {
                // Clear and update the page content
                pageContent.innerHTML = '';
                pageContent.appendChild(loadedContainer.cloneNode(true));
                
                // Process and execute scripts
                executeScripts(absoluteUrl, htmlDoc);
                
                // Load CSS files if they exist
                loadStylesheets(absoluteUrl, htmlDoc);
            } else {
                throw new Error('Could not find content container in the loaded page');
            }
        })
        .catch(error => {
            console.error("Error loading page:", error);
            pageContent.innerHTML = `<div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading content: ${error.message}</p>
            </div>`;
        });
}

// Helper function to get absolute URL
function getAbsoluteUrl(relativeUrl) {
    // Create a dummy anchor element to resolve the URL
    const anchor = document.createElement('a');
    anchor.href = relativeUrl;
    return anchor.href;
}

// Function to safely create a URL
function resolveUrl(baseUrl, relativeUrl) {
    try {
        return new URL(relativeUrl, baseUrl).href;
    } catch (error) {
        console.error(`Error resolving URL: ${baseUrl} + ${relativeUrl}`, error);
        // Fallback to the original URL if there's an error
        return relativeUrl;
    }
}

// Function to handle script execution
function executeScripts(baseUrl, htmlDoc) {
    // Get all scripts from the loaded page
    const scripts = htmlDoc.querySelectorAll('script');
    
    scripts.forEach(script => {
        const newScript = document.createElement('script');
        
        if (script.src) {
            try {
                // Convert relative URLs to absolute
                const scriptSrc = resolveUrl(baseUrl, script.src);
                newScript.src = scriptSrc;
                
                // Add script to document to execute it
                document.body.appendChild(newScript);
            } catch (error) {
                console.error("Error loading script:", error);
                // Use the original src as fallback
                newScript.src = script.src;
                document.body.appendChild(newScript);
            }
        } else if (script.textContent) {
            // For inline scripts
            newScript.textContent = script.textContent;
            
            // Add to document to execute
            document.body.appendChild(newScript);
        }
    });
}

// Function to load stylesheets
function loadStylesheets(baseUrl, htmlDoc) {
    // Get all stylesheet links
    const stylesheets = htmlDoc.querySelectorAll('link[rel="stylesheet"]');
    
    // Keep track of already loaded stylesheets
    const loadedStylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .map(link => link.href);
    
    stylesheets.forEach(stylesheet => {
        try {
            // Convert relative URLs to absolute
            const stylesheetHref = resolveUrl(baseUrl, stylesheet.href);
            
            // Only load if not already loaded
            if (!loadedStylesheets.includes(stylesheetHref)) {
                const newStylesheet = document.createElement('link');
                newStylesheet.rel = 'stylesheet';
                newStylesheet.href = stylesheetHref;
                newStylesheet.setAttribute('data-dynamic-load', 'true');
                
                document.head.appendChild(newStylesheet);
                loadedStylesheets.push(stylesheetHref);
            }
        } catch (error) {
            console.error("Error loading stylesheet:", error);
            // Fallback to original href
            if (!loadedStylesheets.includes(stylesheet.href)) {
                const newStylesheet = document.createElement('link');
                newStylesheet.rel = 'stylesheet';
                newStylesheet.href = stylesheet.href;
                document.head.appendChild(newStylesheet);
            }
        }
    });
}

// Window resize event
window.addEventListener('resize', handleResponsiveLayout);

// Initialize by loading dashboard or first active menu item
document.addEventListener('DOMContentLoaded', () => {
    const activeMenuItem = document.querySelector('.menu-item.active .menu-link');
    if (activeMenuItem && activeMenuItem.getAttribute('href') !== '#') {
        activeMenuItem.click();
    }
});
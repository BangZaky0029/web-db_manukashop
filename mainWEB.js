document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const openSidebarBtn = document.getElementById('openSidebar');
    const closeSidebarBtn = document.getElementById('closeSidebar');
    const pageContent = document.getElementById('pageContent');
    const overlay = document.createElement('div');
    overlay.classList.add('sidebar-overlay');
    document.body.appendChild(overlay);

    // Links for different pages
    const pageLinks = {
        'table-pesanan': 'GetDB/table_pesanan/tablePesanan.html',
        'table-input-order': 'GetDB/table_input_order/tableInputOrder.html',
        'form-input-pesanan': 'PostDB/inputOrder.html',
        'table-design': 'GetDB/table_design/tableDesign.html',
        'table-produksi': 'GetDB/table_produksi/tableProduksi.html'
    };

    // Toggle Sidebar Function
    function toggleSidebar(open = true) {
        if (open) {
            sidebar.classList.add('open');
            overlay.classList.add('active');
        } else {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        }
    }

    // Event Listeners for Sidebar
    openSidebarBtn.addEventListener('click', () => toggleSidebar(true));
    closeSidebarBtn.addEventListener('click', () => toggleSidebar(false));
    overlay.addEventListener('click', () => toggleSidebar(false));

    // Page Content Loading
    const menuItems = document.querySelectorAll('.sidebar-menu li, .sidebar-footer button');
    
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            // Close sidebar and overlay
            toggleSidebar(false);

            // Get page to load
            const page = item.getAttribute('data-page');

            // Handle default pages (settings, account)
            if (page === 'settings' || page === 'account') {
                pageContent.innerHTML = `
                    <div class="page-section">
                        <h2>${page.charAt(0).toUpperCase() + page.slice(1)}</h2>
                        <p>${page} page content goes here.</p>
                    </div>
                `;
                return;
            }

            // Open links in new blank window
            if (pageLinks[page]) {
                window.open(pageLinks[page], '_blank');
            }
        });
    });

    // Responsive Resize Handling
    function handleResponsiveLayout() {
        const width = window.innerWidth;
        
        if (width >= 769) {
            // Desktop view
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
            sidebar.style.display = 'block';
        } else {
            // Mobile view
            sidebar.style.display = 'block';
        }
    }

    // Initial responsive check
    handleResponsiveLayout();

    // Listen for window resize
    window.addEventListener('resize', handleResponsiveLayout);
});
<style>
    /* Push everything down to make room for banner */
    body { padding-top: 50px !important; }
    /* Side navbar panel */
    #navbar > .navbar { top: 50px !important; }
    /* Navbar header (logo, toggle button) */
    #navbar .navbar-header { top: 50px !important; position: relative; }
    /* Top bar with admin menu */
    #navbar .navbar-right { top: 50px !important; }
    /* Side menu backdrop */
    #navbar .side-menu-backdrop { top: 50px !important; }
    /* Main content container */
    #content.container.content { margin-top: 100px !important; }
</style>
<div id="classic-banner" style="
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 44px;
    background: linear-gradient(90deg, #6b7280 0%, #4b5563 100%);
    color: white;
    text-align: center;
    padding: 8px 16px;
    font-size: 14px;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-sizing: border-box;
">
    <span style="font-weight: 500;">
        This is our classic frontend.
    </span>
    <a id="modern-view-link" href="/" data-action="switchToModernView" style="color: white; text-decoration: underline; font-weight: 600;">
        Switch to Modern View
    </a>
</div>
<header id="header">{{{header}}}</header>
<div id="content" class="container content">
    <div id="main" tabindex="-1">{{{main}}}</div>
</div>
<footer id="footer">{{{footer}}}</footer>
<div class="collapsed-modal-bar"></div>

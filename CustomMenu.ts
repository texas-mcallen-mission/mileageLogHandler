function onOpen() {
    var ui = SpreadsheetApp.getUi();
    // Or DocumentApp or FormApp.
    ui.createMenu('Custom Menu')
        .addItem('photoUpdater', 'menu_photoUpdater')
        .addSeparator()
        .addItem('sortSlides', 'run_SortSlides')
        .addSeparator()
        .addItem('updateAreaNames', 'menu_updateAreaNames')
        .addToUi();
}

function menu_photoUpdater() {
    SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
    run_photoUpdater();
}

function menu_sortSlides() {
    SpreadsheetApp.getUi(); // Or DocumentApp or FormApp.
    run_sortSlides();
        
}

function menu_updateAreaNames() {
    SpreadsheetApp.getUi();
    run_updateAreaNames();
}
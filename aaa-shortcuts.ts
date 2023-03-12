
// Shortcuts for tutorial so that things go faster.

function run_importContacts() {
    let contactSheet = new SheetData(new RawSheetData(contactConfig));
    importContactsV2(contactSheet);
}

function scheduler() {
    let config = mergeConfigs_();
    // run the contacts importer every two hours
    ScriptApp.newTrigger("run_importContacts").timeBased().everyHours(2).after(5).create();
   
}
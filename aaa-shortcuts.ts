
// Shortcuts for tutorial so that things go faster.

function run_importContacts() {
    let contactSheet = new SheetData(new RawSheetData(contactConfig));
    importContactsV2(contactSheet);
}

function run_photoUpdater() {
    photoUpdater();
}

function run_sortSlides() {
    sortSlides();
}

function run_updateAreaNames() {
    updateAreaNames();
}

function run_runUpdates() {
    runUpdates();
}

function scheduler() {
    let config : configOptions = mergeConfigs_();
    // run the contacts importer every two hours
    ScriptApp.newTrigger("run_importContacts").timeBased().everyHours(2).create();
    // run the photo updater every hour
    ScriptApp.newTrigger("run_photoUpdater").timeBased().everyHours(1).create();
    // run the sort slide every hour
    ScriptApp.newTrigger("run_sortSlides").timeBased().everyHours(1).create();
    // run updates area names
    ScriptApp.newTrigger("run_updateAreaNames").timeBased().everyDays(1).create();
    // runs runUpdates on open
    const form = FormApp.openByUrl(config.response_form_url);
    ScriptApp.newTrigger("run_runUpdates").forForm(form).onFormSubmit().create();
}
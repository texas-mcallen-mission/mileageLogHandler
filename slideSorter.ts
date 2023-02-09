function sortSlides() {
    let sortSheet = new SheetData(new RawSheetData(datastoreConfig))
    let rawData = sortSheet.getData()
    let sortData = new kiDataClass(convertKisToSlideEntries(rawData))

    // this is a bit more of a pain than I thought it was going to be...
    /*
        let presentation = SlidesApp.openById("SLIDE ID")
        let slide = presentation.getSlideById("SLIDE PAGE OBJECT ID")
        slide.move(0)

       */

    // need to go hit the whiteboard for a bit before writing this
}

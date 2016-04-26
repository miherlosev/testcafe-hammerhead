var dataSource = {
    DATA_KEY_NAME: 'analog_of_via_hypothes_is',
    getData: function () {
        return window.localStorage[this.DATA_KEY_NAME] || {};
    },
    setData: function (data) {
        window.localStorage[this.DATA_KEY_NAME] = data;
    },
    getNoteList: function (siteUrl) {
        var data      = this.getData();
        var siteNotes = data[siteUrl] || {};
    
        return siteNotes.notes || [];
    },
    addNewNote: function (siteUrl, newNote) {
        var data      = this.getData();
        var siteNotes = data[siteUrl] || [];
    
        siteNotes.push(newNote);
        data[siteUrl] = siteNotes;
        this.setData(data);
    }
};

var hammerhead          = window['%hammerhead%'];
var shadowUI            = hammerhead.shadowUI;
var destinationLocation = hammerhead.get('./utils/destination-location');
var siteUrl             = destinationLocation.get();

hammerhead.start();

var controlPanel = {
    _renderContainer: function () {
        var notesContainer       = document.createElement('div');

        notesContainer.className = 'notes-container';
        this.notesContainer = notesContainer;
        this.paneElement.appendChild(notesContainer);
    },
    _renderHeader: function () {
        var notesHeaderContainer = document.createElement('div');

        notesHeaderContainer.textContent = 'Notes';
        notesHeaderContainer.className = 'notes-header-container';
        this.notesContainer.appendChild(notesHeaderContainer);
    },
    _renderNoteList:         function () {
        var notesListContainer = document.createElement('div');
        var notesList          = document.createElement('ul');

        notesListContainer.className = 'notes-list-container';
        this.notesContainer.appendChild(notesListContainer);
        notesList.className = 'notes-list';

        var items   = dataSource.getNoteList(siteUrl);

        if (items.length === 0) {
            var emptyLi = document.createElement('li');

            emptyLi.textContent = 'No data to display';
            notesList.appendChild(emptyLi);
        }
        else {
            for(var i = 0; i < items.length; i++){
                var li = document.createElement('li');

                li.textContent = items[i];
                notesList.appendChild(li);
            }
        }

        notesListContainer.appendChild(notesList);
        this.notesList = notesList;
    },
    _renderNewNote: function (text) {
        var li = 
        this.notesList.appendChild()
    },
    _renderNewNoteContainer: function () {
        var newNoteContainer = document.createElement('div');

        newNoteContainer.className = 'new-note-container';
        this.notesContainer.appendChild(newNoteContainer);

        var newNoteTextContainer = document.createElement('div');
        var newNoteText          = document.createElement('textarea');

        newNoteTextContainer.className = 'new-note-text-container';
        newNoteText.className = 'new-note-text';
        newNoteTextContainer.appendChild(newNoteText);
        newNoteContainer.appendChild(newNoteTextContainer);

        var addNewNoteContainer = document.createElement('div');
        var addNewNoteButton    = document.createElement('button');

        addNewNoteContainer.className = 'add-new-note-container';
        addNewNoteButton.className = 'add-new-note';
        addNewNoteButton.textContent = 'Add';
        addNewNoteButton.addEventListener('click', function () {
           dataSource.addNewNote(siteUrl, newNoteText.value);
        });
        addNewNoteContainer.appendChild(addNewNoteButton);
        newNoteContainer.appendChild(addNewNoteContainer);

        this.newNoteText = newNoteText;
    },
    _renderNotes:            function () {
        this._renderContainer();
        this._renderHeader();
        this._renderNoteList();
        this._renderNewNoteContainer();
    },
    _drawActionPane:         function () {
        this.paneElement = document.createElement('div');

        shadowUI.addClass(this.paneElement, 'pane');
        shadowUI.getRoot().appendChild(this.paneElement);
    },
    init:                    function () {
        this._drawActionPane();
        this._renderNotes();
    }
};

document.addEventListener('DOMContentLoaded', function () {
    controlPanel.init();
});



var hammerhead = window['%hammerhead%'];
var shadowUI   = hammerhead.shadowUI;

hammerhead.start();

var controlPanel = {};

controlPanel.renderNotes = function () {
    var notesContainer   = document.createElement('div');
    var notesHeader      = document.createElement('div');
    var newNoteContainer = document.createElement('div');
    var addNewNote       = document.createElement('button');

    notesHeader.textContent = 'Notes';
    notesHeader.className = 'notes-header';
    notesContainer.appendChild(notesHeader);
    notesContainer.appendChild(newNoteContainer);
    notesContainer.className = 'notes-container';
    newNoteContainer.appendChild(addNewNote);
    newNoteContainer.className = 'new-note';

    this.paneElement.appendChild(notesContainer);
};

controlPanel.drawActionPane = function () {
    this.paneElement = document.createElement('div');

    shadowUI.addClass(this.paneElement, 'pane');
    shadowUI.getRoot().appendChild(this.paneElement);
};

controlPanel.init = function () {
    this.drawActionPane();
    this.renderNotes();
};

document.addEventListener('DOMContentLoaded', function () {
    controlPanel.init();
});



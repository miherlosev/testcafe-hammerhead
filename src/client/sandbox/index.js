import INTERNAL_PROPS from '../../processing/dom/internal-properties';
import CodeInstrumentation from './code-instrumentation';
import CookieSandbox from './cookie';
import ElementEditingWatcher from './event/element-editing-watcher';
import EventSandbox from './event';
import EventSimulator from './event/simulator';
import IframeSandbox from './iframe';
import Listeners from './event/listeners';
import MessageSandbox from './event/message';
import NodeMutation from './node/mutation';
import NodeSandbox from './node';
import SandboxBase from './base';
import ShadowUI from './shadow-ui';
import TimersSandbox from './timers';
import UnloadSandbox from './event/unload';
import UploadSandbox from './upload';
import XhrSandbox from './xhr';
import FetchSandbox from './fetch';
import StorageSandbox from './storages';
import ElectronSandbox from './electron';
import ConsoleSandbox from './console';
import StyleSandbox from './style';
import { isWebKit, isElectron } from '../utils/browser';
import { dispose as htmlUtilDispose } from '../utils/html';
import { dispose as anchorCodeInstumentationDispose } from './code-instrumentation/properties/anchor';
import { create as createSandboxBackup, get as getSandboxBackup } from './backup';
import urlResolver from '../utils/url-resolver';
import * as windowStorage from './windows-storage';
import nativeMethods from '../sandbox/native-methods';

export default class Sandbox extends SandboxBase {
    constructor () {
        super();

        createSandboxBackup(window, this);
        windowStorage.add(window);

        const listeners             = new Listeners();
        const nodeMutation          = new NodeMutation();
        const unloadSandbox         = new UnloadSandbox(listeners);
        const messageSandbox        = new MessageSandbox(listeners, unloadSandbox);
        const eventSimulator        = new EventSimulator();
        const elementEditingWatcher = new ElementEditingWatcher(eventSimulator);
        const timersSandbox         = new TimersSandbox();
        const cookieSandbox         = new CookieSandbox(messageSandbox);

        // API
        // eslint-disable-next-line no-restricted-properties
        this.cookie              = cookieSandbox;
        this.storageSandbox      = new StorageSandbox(listeners, unloadSandbox, eventSimulator);
        this.xhr                 = new XhrSandbox(cookieSandbox);
        this.fetch               = new FetchSandbox(cookieSandbox);
        this.iframe              = new IframeSandbox(nodeMutation, cookieSandbox);
        this.shadowUI            = new ShadowUI(nodeMutation, messageSandbox, this.iframe);
        this.upload              = new UploadSandbox(listeners, eventSimulator, this.shadowUI);
        this.event               = new EventSandbox(listeners, eventSimulator, elementEditingWatcher, unloadSandbox, messageSandbox, this.shadowUI, timersSandbox);
        this.node                = new NodeSandbox(nodeMutation, this.iframe, this.event, this.upload, this.shadowUI, cookieSandbox);
        this.codeInstrumentation = new CodeInstrumentation(this.event, this.node.win);
        this.console             = new ConsoleSandbox(messageSandbox);
        this.style               = new StyleSandbox();
        this.unload              = unloadSandbox;

        if (isElectron)
            this.electron = new ElectronSandbox();

        this.windowStorage = windowStorage;
    }

    // NOTE: In some cases, IE raises the "Can't execute code from a freed script" exception,
    // so that we cannot use a sandbox created earlier and we have to create a new one.
    static _canUseSandbox (sandbox) {
        try {
            sandbox.off();
        }
        catch (e) {
            return false;
        }

        return true;
    }

    onIframeDocumentRecreated (iframe) {
        if (iframe) {
            // NOTE: Try to find an existing iframe sandbox.
            const sandbox = getSandboxBackup(iframe.contentWindow);

            if (sandbox && Sandbox._canUseSandbox(sandbox))
            // NOTE: Inform the sandbox so that it restores communication with the recreated document.
                sandbox.reattach(iframe.contentWindow, iframe.contentDocument);
            else {
                // NOTE: Remove saved native methods for iframe
                if (iframe.contentWindow[INTERNAL_PROPS.iframeNativeMethods])
                    delete iframe.contentWindow[INTERNAL_PROPS.iframeNativeMethods];

                // NOTE: If the iframe sandbox is not found, this means that iframe is not initialized.
                // In this case, we need to inject Hammerhead.

                // HACK: IE10 cleans up overridden methods after the document.write method call.
                this.nativeMethods.restoreOverridenDocumentMethods(iframe.contentWindow);

                // NOTE: A sandbox for this iframe is not found (iframe is not yet initialized).
                // Inform IFrameSandbox about this, and it injects Hammerhead.
                this.iframe.onIframeBeganToRun(iframe);
            }
        }
    }

    reattach (window, document) {
        // NOTE: Assign the existing sandbox to the cleared document.
        this.nativeMethods.refreshIfNecessary(document, window);

        urlResolver.init(document);

        this.event.initDocumentListening(document);

        if (isWebKit && window.top === window)
            this.event.listeners.restartElementListening(window);

        this.shadowUI.attach(window);
        // NOTE: T182337
        this.codeInstrumentation.attach(window);
        this.node.doc.attach(window, document);
        this.console.attach(window);

        // After overriding the `document.open` method, IE demonstrates the strange behaviour:
        // document lost all methods: 'addEventListener', 'createElement' and etc.
        // This is why, we are forced to restore non-overriden methods separately
        this.nativeMethods.restoreDocumentMeths(document);
    }

    attach (window) {
        super.attach(window);

        urlResolver.init(this.document);

        // NOTE: Eval Hammerhead code script.
        this.iframe.on(this.iframe.EVAL_HAMMERHEAD_SCRIPT_EVENT, e => initHammerheadClient(e.iframe.contentWindow, true));

        // NOTE: We need to reattach a sandbox to the recreated iframe document.
        this.node.mutation.on(this.node.mutation.DOCUMENT_CLEANED_EVENT, e => this.reattach(e.window, e.document));

        this.iframe.attach(window);
        this.xhr.attach(window);
        this.fetch.attach(window);
        this.storageSandbox.attach(window);
        this.codeInstrumentation.attach(window);
        this.shadowUI.attach(window);
        this.event.attach(window);
        this.node.attach(window);
        this.upload.attach(window);
        // eslint-disable-next-line no-restricted-properties
        this.cookie.attach(window);
        this.console.attach(window);
        this.style.attach(window);

        if (this.electron)
            this.electron.attach(window);

        this.unload.on(this.unload.UNLOAD_EVENT, () => this.dispose());
    }

    _removeInternalProperties () {
        const removeListeningElement = this.event.listeners.listeningCtx.removeListeningElement;

        removeListeningElement(this.window);
        removeListeningElement(this.document);

        const childNodes = nativeMethods.querySelectorAll.call(this.document, '*');

        for (const childNode of childNodes) {
            delete childNode[INTERNAL_PROPS.processedContext];
            removeListeningElement(childNode);
        }
    }

    dispose () {
        this.event.hover.lastHoveredElement     = null;
        this.event.focusBlur.lastFocusedElement = null;

        htmlUtilDispose();
        anchorCodeInstumentationDispose();
        urlResolver.dispose(this.document);
        this.storageSandbox.dispose();
        this._removeInternalProperties();
    }
}

export default function defineProperty (obj, prop, descriptor) {
    try {
        Object.defineProperty(obj, prop, descriptor);
    }
    catch (e) {
        // NOTE: PhantomJS support (remove try ...catch and use browser.isPhantomJs property)
        if (descriptor.get || descriptor.set) {
            var objPrototype = obj.constructor.prototype;

            if (descriptor.get)
                objPrototype.__defineGetter__(prop, descriptor.get);
            if (descriptor.set)
                objPrototype.__defineSetter__(prop, descriptor.set);
        }
        else
            obj[prop] = descriptor.value;
    }
}

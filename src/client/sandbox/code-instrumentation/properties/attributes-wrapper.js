import { isHammerheadAttr } from '../../../utils/dom';
import { getStoredAttrName } from '../../../dom-processor';
import fnBind from '../../../utils/fn-bind';
import nativeMethods from '../../native-methods';
import defineProperty from '../../../utils/define-property';

export default class AttributesWrapper {
    constructor (attributes) {
        var length = 0;

        for (var i = 0; i < attributes.length; i++) {
            var attr = attributes[i];

            if (!isHammerheadAttr(attr.name)) {
                var storedAttrName = attributes[getStoredAttrName(attr.name)];

                if (storedAttrName) {
                    attr       = nativeMethods.cloneNode.call(attr);
                    attr.value = storedAttrName.value;
                    defineProperty(this, attr.name, { value: attr });
                }

                defineProperty(this, length, { value: attr });
                length++;
            }
        }

        defineProperty(this, 'length', { value: length });

        this.item = index => this[index];

        for (var funcName in attributes) {
            if (typeof this[funcName] === 'function' && funcName !== 'item')
                this[funcName] = fnBind(attributes[funcName], attributes);
        }
    }
}

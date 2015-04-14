angular.module('caiLunAdminUi.common')
    .service('wipService', WipService);

/**
 * Service to track work-in-progress (WIP) items, i.e. objects which have
 * been opened for editing but have not had their changes persisted back
 * to the server. This service allows the user to edit multiple open objects
 * at once, and tracks whether they need to be persisted.
 *
 * In any of these methods that have an `item` requirement, `item` must be an
 * object with a `uuid` property.
 *
 * @constructor
 */
function WipService() {
    var wipStore = {},
        modifiedWips = {},
        onWipChangeCallbacks = [];

    this.openItem = openItem;
    this.setAsModified = setAsModified;
    this.setAsUnmodified = setAsUnmodified;
    this.isModified = isModified;
    this.closeItem = closeItem;
    this.getItem = getItem;
    this.getOpenItems = getOpenItems;
    this.getModifiedItems = getModifiedItems;
    this.registerWipChangeHandler = registerWipChangeHandler;

    /**
     * Add a new wip item of specified type to the store.
     * @param {String} type
     * @param {Object} item
     */
    function openItem(type, item) {
        validateItem(item);
        if (!wipStore[type]) {
            wipStore[type] = {};
            modifiedWips[type] = {};
        }
        wipStore[type][item.uuid] = item;
        invokeChangeCallbacks();
    }

    /**
     * Add the __wipModified flag to the item to indicate that it has been modified,
     * which determines its behaviour on closing.
     *
     * @param {String} type
     * @param {Object} item
     */
    function setAsModified(type, item) {
        validateItem(item);
        checkItemExists(type, item);
        modifiedWips[type][item.uuid] = true;
        invokeChangeCallbacks();
    }

    /**
     * Set the item to be unmodified. Useful in the situation where a modified item
     * is persisted to the server, but we want to keep it open in the wipStore but
     * indicate that it is unmodified and okay to close.
     *
     * @param {String} type
     * @param {Object} item
     */
    function setAsUnmodified(type, item) {
        validateItem(item);
        checkItemExists(type, item);
        modifiedWips[type][item.uuid] = false;
        invokeChangeCallbacks();
    }

    /**
     * Checks to see if the item in the store has been modified.
     *
     * @param {String} type
     * @param {Object} item
     * @returns {boolean}
     */
    function isModified(type, item) {
        validateItem(item);
        checkItemExists(type, item);
        return modifiedWips[type][item.uuid] === true;
    }

    /**
     * Remove an existing item of the specified type from the store.
     * @param {String} type
     * @param {Object} item
     */
    function closeItem(type, item) {
        validateItem(item);
        checkItemExists(type, item);
        delete wipStore[type][item.uuid];
        invokeChangeCallbacks();
    }

    /**
     * Get an array of all open items of the specified type.
     * @param {String} type
     * @returns {Array}
     */
    function getOpenItems(type) {
        var itemsArray = [];

        if (wipStore[type]) {
            for (var key in wipStore[type]) {
                if (wipStore[type].hasOwnProperty(key)) {
                    itemsArray.push(wipStore[type][key]);
                }
            }
        }
        return itemsArray;
    }

    /**
     * Get an array of uuids of each item of the specified type which has been modified.
     * @param {String} type
     * @returns {Array}
     */
    function getModifiedItems(type) {
        var itemsArray = [];

        if (modifiedWips[type]) {
            for (var key in modifiedWips[type]) {
                if (modifiedWips[type].hasOwnProperty(key) && modifiedWips[type][key] === true) {
                    itemsArray.push(key);
                }
            }
        }
        return itemsArray;
    }

    /**
     * Returns the wip content specified by the uuid if it exists in the contents store.
     *
     * @param {String} type
     * @param {String} uuid
     * @returns {*}
     */
    function getItem(type, uuid) {
        return wipStore[type] && wipStore[type][uuid];
    }

    /**
     * Register a callback function which will be invoked every time there is a change to
     * the status of wip items (i.e. whenever a new wip item is opened, or an existing one
     * is closed).
     *
     * @param {Function} callback
     */
    function registerWipChangeHandler(callback) {
        onWipChangeCallbacks.push(callback);
    }

    /**
     * Invokes any change handler callbacks which were previously registered via
     * registerWipChangeHandler().
     */
    function invokeChangeCallbacks() {
        onWipChangeCallbacks.forEach(function(fn) {
            fn();
        });
    }

    /**
     * Throws an exception if the item object does not have a `uuid` property.
     * @param item
     */
    function validateItem(item) {
        if (!item.uuid) {
            throw new Error('wipService: `item` does not have a `uuid` property.');
        }
    }

    function checkItemExists(type, item) {
        if (!wipStore[type]) {
            throw new Error('wipService: the wipStore does not contain any items of the type "' + type + '".');
        } else if (!wipStore[type][item.uuid]) {
            throw new Error('wipService: item of type "' + type + '" with uuid "' + item.uuid + '" not found.');
        }
    }
}
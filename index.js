const clearAllWindowRanges = () => window.getSelection().removeAllRanges();

const removeElementsFromHTMLByClassName = (className) => {
    const elements = document.getElementsByClassName(className);
    [...elements].forEach(element => element.remove());
}

const insertWordItemsToTheList = () => {
    const recentlyAddedList = document.getElementById('recently-added');
    ['recent-item', 'notify-message'].forEach(className => removeElementsFromHTMLByClassName(className));

    chrome.storage.sync.get(['expressions'], function (result) {
        const expressions = result?.expressions?.length ? result.expressions : [];
        if (!expressions.length) {
            recentlyAddedList.insertAdjacentHTML('beforeend', `
                <span class="notify-message" style="color: white;">You have not added any expression yet</span>
            `);
        }
        for (const expression of expressions) {
            recentlyAddedList.insertAdjacentHTML('beforeend', `
                <li class="list-group-item recent-item">${expression}</li>
            `)
        }
    });
}

const getButtonTemplate = (screenCoordinates) => {
    const { x, y } = screenCoordinates;
    // We need to set these cords so that there are no conflicts with google translate extension icon.
    const finalX = x - 40;
    const finalY = y + 10;
    return `
    <button
        class="pleasure-button"
        style="
        width: 24px;
        display: flex;
        justify-content: center;
        align-content: center;
        padding-bottom: 3px;
        position: fixed;
        font-size: 16px;
        font-weight: 600;
        outline: none;
        color: white;
        z-index: 9999;
        border-radius: 4px;
        box-shadow: 0px 0px 3px 0px #ece2e2;
        background-color: #c81616;
        border: none;
        cursor: pointer;
        top: ${finalY}px;
        left: ${finalX}px;
        "
        >
        +
    </button>
    `
}

const setWordToChromeStorage = (expression, fn = null) => {
    chrome.storage.sync.get(['expressions'], function (result) {
        const expressions = result?.expressions?.length ? [...result.expressions, expression] : [expression];
        chrome.storage.sync.set({ expressions }, fn);
    });
};

const getSelectedText = (browserEvent) => {
    const { clientX, clientY } = browserEvent;
    let userSelection;
    if (window.getSelection) {
        userSelection = window.getSelection();
    }
    else if (document.selection) {
        userSelection = document.selection.createRange();
    }

    let selectedText = userSelection.toString();
    if (userSelection.text) selectedText = userSelection.text.toString();
    if (selectedText != '') {
        return {
            selectedText,
            x: clientX,
            y: clientY
        }
    }
    return '';
}

window.addEventListener('mouseup', (event) => {
    if (event.target.className === 'pleasure-button') {
        const { selectedText } = getSelectedText(event);
        const expression = selectedText;
        setWordToChromeStorage(expression);
        clearAllWindowRanges();
        removeElementsFromHTMLByClassName('pleasure-button');
    }
    removeElementsFromHTMLByClassName('pleasure-button');
    const { selectedText, x, y } = getSelectedText(event);
    if (!selectedText) return;

    const body = document.querySelector('body');
    body.insertAdjacentHTML('beforeend', getButtonTemplate({ x, y }));
});

window.addEventListener('DOMContentLoaded', () => {
    insertWordItemsToTheList();
    const clearButton = document.getElementById('clear');
    const downloadButton = document.getElementById('download');
    clearButton.addEventListener('click', () => {
        chrome.storage.sync.clear();
        insertWordItemsToTheList();
    });

    downloadButton.addEventListener('click', () => {
        chrome.storage.sync.get(['expressions'], (result) => {
            const content = (result?.expressions ?? []).map(expression => expression + " \n");
            const blob = new Blob(content, { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            chrome.downloads.download({
                url,
                filename: 'dictionary.txt'
            });
        })
    })
})


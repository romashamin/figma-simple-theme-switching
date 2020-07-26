// Helpers
function getStyleNameFromNode(node) {
    if (!node || !('fillStyleId' in node) || (node.fillStyleId === ''))
        return;
    const styleId = node.fillStyleId;
    const style = figma.getStyleById(styleId);
    return style === null || style === void 0 ? void 0 : style.name;
}
const themeHelper = (() => {
    const regexThemeSlash = /theme.+?(?=\/|\s+\/)/i;
    function getThemeNameFromString(str) {
        const themesNames = str.match(regexThemeSlash);
        if (!themesNames)
            return;
        const [firstThemeName] = themesNames;
        return firstThemeName;
    }
    function replaceThemeInName(name, targetTheme) {
        return name.replace(regexThemeSlash, targetTheme);
    }
    return {
        getThemeNameFromString,
        replaceThemeInName
    };
})();
// Handle themes
function getThemesNames() {
    const paintStyles = figma.getLocalPaintStyles();
    const paintStylesNames = paintStyles.map(style => style.name);
    let themesNames = [];
    paintStylesNames.forEach(styleName => {
        const themeName = themeHelper.getThemeNameFromString(styleName);
        if (themeName)
            themesNames.push(themeName);
    });
    const themesNamesUnique = [...new Set(themesNames)];
    return themesNamesUnique;
}
function handleThemes() {
    const themesNames = getThemesNames();
    const data = themesNames.map(themeName => ({
        themeName,
        cssId: getCSSIdForThemeName(themeName)
    }));
    figma.ui.postMessage({
        type: 'render',
        data
    });
}
// Handle selection
function getCSSIdForThemeName(themeName) {
    return themeName.replace(/\s+/g, '-').toLowerCase();
}
function getThemeNameFromNode(node) {
    if (!node || !('fillStyleId' in node) || (node.fillStyleId === ''))
        return null;
    const styleName = getStyleNameFromNode(node);
    const themeName = themeHelper.getThemeNameFromString(styleName);
    if (themeName)
        return themeName;
    return null;
}
function handleSelection() {
    const [firstNode] = figma.currentPage.selection;
    if (!firstNode) {
        figma.ui.postMessage({ type: 'options-disable-all' });
        return;
    }
    let themeName = getThemeNameFromNode(firstNode);
    if (themeName) {
        figma.ui.postMessage({ type: 'options-enable-all' });
        const cssId = getCSSIdForThemeName(themeName);
        figma.ui.postMessage({
            type: 'options-select-theme',
            cssId
        });
        return;
    }
    if (!('findOne' in firstNode)) {
        figma.ui.postMessage({ type: 'options-disable-all' });
        return;
    }
    themeName = getThemeNameFromNode(firstNode === null || firstNode === void 0 ? void 0 : firstNode.findOne(node => !!getThemeNameFromNode(node)));
    if (themeName) {
        figma.ui.postMessage({ type: 'options-enable-all' });
        const cssId = getCSSIdForThemeName(themeName);
        figma.ui.postMessage({
            type: 'options-select-theme',
            cssId
        });
        return;
    }
    figma.ui.postMessage({ type: 'options-disable-all' });
}
// Switch theme for selection
function getStyleByName(name) {
    const styles = figma.getLocalPaintStyles();
    const styleWithGivenName = styles.find(style => style.name === name);
    return styleWithGivenName;
}
function switchThemeForNode(node, targetThemeName) {
    const styleName = getStyleNameFromNode(node);
    const styleNameWithTargetTheme = themeHelper.replaceThemeInName(styleName, targetThemeName);
    const styleWithTargetTheme = getStyleByName(styleNameWithTargetTheme);
    node.fillStyleId = styleWithTargetTheme === null || styleWithTargetTheme === void 0 ? void 0 : styleWithTargetTheme.id;
}
// Start point
figma.showUI(__html__);
handleThemes();
handleSelection();
// Events handlers
figma.ui.onmessage = msg => {
    switch (msg.type) {
        case 'switch-theme-for-selected-layout': {
            const [firstNode] = figma.currentPage.selection;
            if (!firstNode)
                break;
            let nodesWithTheme = [];
            if ('findAll' in firstNode) {
                nodesWithTheme = firstNode.findAll(node => !!getThemeNameFromNode(node));
            }
            if (!!getThemeNameFromNode(firstNode))
                nodesWithTheme.push(firstNode);
            nodesWithTheme.forEach(node => switchThemeForNode(node, msg.themeName));
            break;
        }
        default: {
            break;
        }
    }
};
figma.on("selectionchange", handleSelection);

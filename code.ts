// Helpers

function getStyleNameFromNode(node) {
  if (!node || !("fillStyleId" in node) || node.fillStyleId === "") return;
  return figma.getStyleById(node.fillStyleId)?.name;
}

const regexThemeSlash = /theme.+?(?=\/|\s+\/)/i;

function getThemeNameFromString(str) {
  const themesNames = str.match(regexThemeSlash);
  return themesNames ? themesNames[0] : null;
}

function replaceThemeInName(name, targetTheme) {
  return name.replace(regexThemeSlash, targetTheme);
}

// Handle themes

function getThemesNames() {
  const styles = figma.getLocalPaintStyles();
  const stylesNames = styles.map((style) => style.name);

  const themesNames = stylesNames.reduce((themesNames, styleName) => {
    const themeName = getThemeNameFromString(styleName);
    if (themeName) themesNames.push(themeName);
    return themesNames;
  }, []);

  const themesNamesUnique = [...new Set(themesNames)];
  return themesNamesUnique;
}

function handleThemes() {
  const themesNames = getThemesNames();
  const data = themesNames.map((themeName) => ({
    themeName,
    cssId: getCSSIdForThemeName(themeName),
  }));
  figma.ui.postMessage({
    type: "render",
    data,
  });
}

// Handle selection

function getCSSIdForThemeName(themeName: string): string {
  return themeName.replace(/\s+/g, "-").toLowerCase();
}

function getThemeNameFromNode(node) {
  if (!node || !("fillStyleId" in node) || node.fillStyleId === "") return null;
  const styleName = getStyleNameFromNode(node);
  return getThemeNameFromString(styleName);
}

function getThemeName(node) {
  if (!node) return null;

  const themeName = getThemeNameFromNode(node);
  if (themeName) return themeName;

  if ("findOne" in node) {
    return getThemeNameFromNode(
      node.findOne((node) => !!getThemeNameFromNode(node))
    );
  }
  return null;
}

function handleSelection() {
  const [firstNode] = figma.currentPage.selection;
  const themeName = getThemeName(firstNode);
  if (themeName) {
    figma.ui.postMessage({ type: "options-enable-all" });
    const cssId = getCSSIdForThemeName(themeName);
    figma.ui.postMessage({
      type: "options-select-theme",
      cssId,
    });
  } else {
    figma.ui.postMessage({ type: "options-disable-all" });
  }
}

// Switch theme for selection

function getStyleByName(name) {
  return figma.getLocalPaintStyles().find((style) => style.name === name);
}

function switchThemeForNode(node, targetThemeName) {
  const styleName = getStyleNameFromNode(node);
  const styleNameWithTargetTheme = replaceThemeInName(
    styleName,
    targetThemeName
  );
  const styleWithTargetTheme = getStyleByName(styleNameWithTargetTheme);
  if (styleWithTargetTheme) node.fillStyleId = styleWithTargetTheme.id;
}

// Start point

figma.showUI(__html__);

handleThemes();
handleSelection();

// Events handlers

figma.ui.onmessage = (msg) => {
  if (msg.type === "switch-theme-for-selected-layout") {
    const [firstNode] = figma.currentPage.selection;
    if (!firstNode) return;
    let nodesWithTheme = [];
    if ("findAll" in firstNode) {
      nodesWithTheme = firstNode.findAll(
        (node) => !!getThemeNameFromNode(node)
      );
    }
    if (getThemeNameFromNode(firstNode)) nodesWithTheme.push(firstNode);
    nodesWithTheme.forEach((node) => switchThemeForNode(node, msg.themeName));
  }
};

figma.on("selectionchange", handleSelection);

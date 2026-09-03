// English text catalog. PURE DATA: key -> text pairs, no logic, no imports.
// May be temporarily incomplete during development; t() falls back to CATALOG_ES.
// Entries shaped { one, other } are plurals (t() picks by params.count).
// Board-game glossary: mazo=deck, carta=card, ficha=token, tablero=board,
// dado=die/dice, etiqueta=tag, recurso=resource, componente=component.

export const CATALOG_EN = {
  // --- App / document ---
  'app.documentTitle': 'BG Factory',
  'appVersion.repoLink': 'View on GitHub',

  // --- Startup toasts ---
  'toast.stateRecoverFailedVersion': 'Could not restore state from a previous version; started with the default content.',
  'toast.stateRecoverFailedCorrupt': 'Could not restore the saved state.',

  // --- Seed resources ---
  'defaultResource.exampleImage': 'Example image',
  'defaultResource.exampleFont': 'Example typeface',

  // --- Common ---
  'common.accept': 'OK',
  'common.cancel': 'Cancel',
  'common.close': 'Close',
  'common.save': 'Save',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.create': 'Create',
  'common.duplicate': 'Duplicate',
  'common.comingSoon': 'Coming soon',
  'common.transparent': 'Transparent',
  'common.color': 'Color',
  'common.none.f': 'None',
  'common.none.m': 'None',
  'common.general': 'General',
  'common.visual': 'Visual',
  'common.background': 'Background',
  'common.content': 'Content',
  'common.clearSearch': 'Clear search',

  // --- Top control bar ---
  'toolbar.modeEdit': 'Edit Mode',
  'toolbar.modePlay': 'Play Mode',
  'toolbar.import': 'Import',
  'toolbar.export': 'Export',
  'toolbar.fitZoom': 'Zoom to fit all elements',
  'toolbar.fitZoom.aria': 'Zoom to fit',
  'toolbar.settings': 'Settings',

  // --- Export menu ---
  'export.menu.gameJson': 'Export game (.json)',
  'export.menu.resourcesZip': 'Export resources (.zip)',
  'export.menu.productionCsv': 'Export production sheet (.csv)',

  // --- Import ---
  'import.error.title': 'Could not import the file',
  'import.error.body': 'The selected file does not contain a valid component list.',
  'import.progress': 'Importing…',
  'import.confirm.title': 'Import — confirm',
  'import.confirm.modeLabel': 'Import mode',
  'import.confirm.mode.overwrite': 'Overwrite the whole game',
  'import.confirm.mode.add': 'Add to existing',
  'import.confirm.conflictLabel': 'Behavior on duplicate id',
  'import.confirm.conflict.overwrite': 'Overwrite the existing one',
  'import.confirm.conflict.keepBoth': 'Keep both',
  'import.confirm.accept': 'Import',
  'import.selection.title': 'Import — choose elements',
  'import.selection.continue': 'Continue',
  'import.report.title': 'Import report',
  'import.conversionError.heading': 'Errors converting tokens',
  'import.conversionError.message': 'Errors were found converting the following tokens to Card/Token. You can continue the import without them, or abort it entirely.',
  'import.conversionError.abort': 'Abort import',
  'import.conversionError.continue': 'Continue without those tokens',
  'import.conversionError.colFicha': 'Affected token',
  'import.conversionError.colError': 'Error',

  // --- Export ---
  'export.selection.title': 'Export',
  'export.selection.nameLabel': 'File name',
  'export.selection.accept': 'Export',

  // --- Component types ---
  'componentType.texto': 'Text box',
  'componentType.tableroSimple': 'Simple board',
  'componentType.tableroPersonalizado': 'Custom board',
  'componentType.dado': 'Configurable die',
  'componentType.documento': 'Document viewer',
  'componentType.carta': 'Card/Token',
  'componentType.mazo': 'Deck',

  // --- "Add component" modal ---
  'componentTypeModal.title': 'Add component',

  // --- Components panel ---
  'componentList.empty': 'No components yet.',
  'componentList.emptyFilter': 'No components match "{filter}".',
  'componentList.title': 'Components ({count})',
  'componentList.add': '+ Add component',
  'componentList.filterPlaceholder': 'Filter components…',
  'componentList.ungroup': 'Ungroup',

  // --- Resources panel ---
  'resourceList.empty': 'No resources yet.',
  'resourceList.emptyFilter': 'No resources match "{filter}".',
  'resourceList.title': 'Resources ({count})',
  'resourceList.add': '+ Add resource ▾',
  'resourceList.filterPlaceholder': 'Filter resources…',

  // --- Tags panel ---
  'tagList.empty': 'No tags yet.',
  'tagList.emptyFilter': 'No tags match "{filter}".',
  'tagList.title': 'Tags ({count})',
  'tagList.add': '+ Add tag',
  'tagList.filterPlaceholder': 'Filter tags…',

  // --- Column menu ---
  'columnMenu.filter': 'Filter',
  'columnMenu.all': 'All',
  'columnMenu.sortAsc': 'Sort A..Z',
  'columnMenu.sortDesc': 'Sort Z..A',

  // --- Context menu ---
  'contextMenu.interactions': 'Interactions',
  'contextMenu.show': 'Show',
  'contextMenu.hide': 'Hide',
  'contextMenu.clone': 'Clone',
  'contextMenu.copy': 'Copy',
  'contextMenu.delete': 'Delete',
  'contextMenu.group': 'Group',
  'contextMenu.ungroup': 'Ungroup',
  'contextMenu.flipCard': 'Flip card',
  'contextMenu.addToTag': 'Add to tag',
  'contextMenu.shuffle': 'Shuffle',
  'contextMenu.viewContent': 'View content...',
  'contextMenu.insertIntoMazo': 'Put into deck...',
  'contextMenu.lock': 'Lock',
  'contextMenu.unlock': 'Unlock',
  'contextMenu.extra.faces': { one: '{count} face', other: '{count} faces' },
  'contextMenu.extra.cards': { one: '{count} card', other: '{count} cards' },

  // --- Interactions (play mode) ---
  'interaction.leftClick': 'Left click',
  'interaction.doubleLeftClick': 'Double left click',
  'interaction.rightClick': 'Right click',
  'interaction.value.none': 'None',
  'interaction.value.openThisMenu': 'Open this menu',
  'interaction.value.rollDie': 'Roll the die',
  'interaction.value.viewResultLarge': 'View the result large',
  'interaction.value.flipCard': 'Flip the card',
  'interaction.value.drawTopCard': 'Draw the top card',

  // --- Progress ---
  'progress.grouping': { one: 'Grouping {count} element…', other: 'Grouping {count} elements…' },
  'progress.ungrouping': { one: 'Ungrouping {count} element…', other: 'Ungrouping {count} elements…' },
  'progress.addingToMazo': { one: 'Adding {count} card to the deck…', other: 'Adding {count} cards to the deck…' },

  // --- Misc toasts ---
  'toast.copiesSynced': 'Copies synced',
  'toast.copiesDesynced': 'Copies unsynced',
  'toast.styleCopied': 'Style copied',
  'toast.tagAdded': 'Tag added',

  // --- Misc errors ---
  'error.generic.title': 'Error',
  'error.notice.title': 'Notice',
  'error.unsupportedFileFormat': 'Unsupported file format.',
  'error.noValidResourceInFolder': 'No valid resource was found in the selected folder.',
  'error.resourceInUse': 'Resource "{name}" is in use by: {ids} and cannot be deleted.',

  // --- Bulk delete confirmation ---
  'bulkDelete.title': { one: 'Delete {count} component', other: 'Delete {count} components' },
  'bulkDelete.message': 'The following elements will be deleted:',

  // --- Delete tag-in-use confirmation ---
  'tagDelete.title': 'Delete tag in use',
  'tagDelete.message': 'Tag "{name}" is being used by the following elements. If you continue, the tag will be deleted and those elements will lose their membership to it.',

  // --- Settings modal ---
  'settings.title': 'Settings',
  'settings.language.label': 'Language',
  'settings.version.label': 'Version',

  // --- Component modal ---
  'componentModal.idLabel': 'Component ID',
  'componentModal.sizeLegend': 'Size',
  'componentModal.heightLabel': 'Height (px)',
  'componentModal.widthLabel': 'Width (px)',
  'componentModal.keepRatio': 'Keep proportion',
  'componentModal.locked': 'Locked',
  'componentModal.hidden': 'Hidden',
  'componentModal.raiseOnMove': 'Raise on move/interact',
  'componentModal.playerHelp': 'Player help',
  'componentModal.showTitle': 'Show component title',
  'componentModal.editTitle': 'Edit component title…',
  'componentModal.showTooltip': 'Show help',
  'componentModal.tooltipText': 'Help',
  'componentModal.styleLegend': 'Style',
  'componentModal.extrusionLegend': 'Extrusion',
  'componentModal.depthLabel': 'Depth (px)',
  'componentModal.extrusionColor': 'Extrusion color',
  'componentModal.tagsLegend': 'Tags',
  'componentModal.createNewTag': '+ Create new tag…',
  'componentModal.tagNameEmpty': 'The name cannot be empty',
  'componentModal.tagNameTaken': 'A tag with this name already exists',
  'componentModal.tagNamePlaceholder': 'New tag name',
  'componentModal.programmedInteractions': 'Programmed interactions',
  'componentModal.rightClickLabel': 'Right click',
  'componentModal.rightClick.openContextMenu': 'Open context menu',
  'componentModal.idEmpty': 'The ID cannot be empty',
  'componentModal.idTaken': 'Another component with this ID already exists',
  'componentModal.noCopies': 'This object has no copies.',
  'componentModal.copiesCount': 'Copies: {count}',
  'componentModal.viewLinkedCopies': 'View linked copies...',
  'componentModal.syncAllCopies': 'Sync all copies',
  'componentModal.desyncAllCopies': 'Unsync all copies',
  'componentModal.fontSizeLabel': 'Font size (px)',
  'componentModal.textColor': 'Text color',
  'componentModal.bgColor': 'Background color',
  'componentModal.noSpecificProps': 'No specific properties',
  'componentModal.noProps': 'This object has no properties',
  'componentModal.bevel': 'Beveled border',
  'componentModal.shadow': 'Shadow',
  'componentModal.borderColor': 'Border color',
  'componentModal.borderWidth': 'Thickness',
  'componentModal.configureBackground': 'Configure background',
  'componentModal.bodyColor': 'Body color',
  'componentModal.numbersColor': 'Numbers color',
  'componentModal.facesConfig': 'Faces configuration',
  'componentModal.maxNumber': 'Maximum number',
  'componentModal.valueList': 'Value list (comma-separated)',
  'componentModal.valueListError': 'The list needs at least 2 values, and at least one cannot be empty',
  'componentModal.fontTypeLabel': 'Font type',
  'componentModal.chooseFont': 'Choose typeface',
  'componentModal.contentTypeLabel': 'Content type',
  'componentModal.formatLabel': 'Format',
  'componentModal.pageUrlLabel': 'Page URL',
  'componentModal.editBoardDesign': 'Edit board design',
  'componentModal.proportionLabel': 'Proportion',
  'componentModal.editCardDesign': 'Edit card design',
  'componentModal.cardStyleLegend': 'Card style',
  'componentModal.copyStyle': 'Copy style',
  'componentModal.pasteStyle': 'Paste style',
  'componentModal.styleHint': 'Copy/paste only the elements you choose: general (includes the tag), proportion, front face and/or back face.',
  'componentModal.cardsCount': { one: '{count} card', other: '{count} cards' },
  'componentModal.shapeLegend': 'Shape',
  'componentModal.shapeLabel': 'Shape',
  'componentModal.orientationLabel': 'Orientation',
  'componentModal.revealedCardsLegend': 'Revealed cards',
  'componentModal.revealDisposition': 'Revealed card layout',
  'componentModal.revealDispositionNote': 'Side of the deck where cards appear when drawn',
  'componentModal.revealedCardText': 'Revealed card text',
  'componentModal.revealCard': 'Reveal card',
  'componentModal.imageLegend': 'Image',
  'componentModal.chooseImage': 'Choose image…',
  'componentModal.adjustImage': 'Adjust image…',
  'componentModal.removeImage': 'Remove image',
  'componentModal.viewMazoContent': 'View deck content',

  // --- Component copies ---
  'componentCopies.title': 'Linked copies',
  'componentCopies.hint': { one: '{id} — {count} copy', other: '{id} — {count} copies' },
  'componentCopies.idHeader': 'Id',
  'componentCopies.syncHeader': 'Synced',

  // --- Copy modal (read-only) ---
  'copyComponent.title': 'Component properties',
  'copyComponent.idLabel': 'Component ID',
  'copyComponent.notice': 'This component is a copy of another element. Its properties cannot be edited here: they sync automatically with the original.',
  'copyComponent.synced': 'Synced',
  'copyComponent.lockedHiddenLegend': 'Locked / Hidden',
  'copyComponent.originalLabel': 'Original element',

  // --- Component title modal ---
  'componentTitleModal.title': 'Edit component title',
  'componentTitleModal.textColor': 'Text color',
  'componentTitleModal.bgColor': 'Background color',
  'componentTitleModal.bgOpacity': 'Background transparency',

  // --- Group modal ---
  'groupModal.title': 'Group properties',
  'groupModal.idLabel': 'Group Id',
  'groupModal.idEmpty': 'The ID cannot be empty',
  'groupModal.idTaken': 'Another group with this ID already exists',
  'groupModal.showTooltip': 'Show tooltip',

  // --- Tag modal ---
  'tagModal.nameLabel': 'Name',
  'tagModal.elementsLabel': 'Tag elements ({count})',
  'tagModal.empty': 'No elements in this tag.',
  'tagModal.remove': 'Remove',
  'tagModal.groupLabel': 'Group:',
  'tagModal.nameEmpty': 'The name cannot be empty',
  'tagModal.nameTaken': 'A tag with this name already exists',

  // --- Resource modal ---
  'resourceKind.image': 'Image',
  'resourceKind.font': 'Typeface',
  'resourceModal.title': 'Resource: {kind} — {name}',
  'resourceModal.nameLabel': 'Resource name',
  'resourceModal.previewLabel': 'Preview',
  'resourceModal.zoomPanHint': 'Mouse wheel to zoom · drag to move the image',
  'resourceModal.changeImage': 'Change image...',
  'resourceModal.acceptChanges': 'Accept changes',
  'resourceModal.closeWindow': 'Close window',
  'resourceModal.fontSample': 'BG Factory sample — ABCDEFGHIJKLMN abcdefghijklmn 0123456789',

  // --- Resource replace confirmation ---
  'resourceReplace.messageSingle': 'A resource named "{name}" already exists. If you continue, its content will be replaced. Components already using it will show the new resource.',
  'resourceReplace.introMulti': '{count} of the selected files match resources already in the gallery:',
  'resourceReplace.outro': 'If you continue, their content will be replaced. The remaining files with no conflict will be added normally.',
  'resourceReplace.replace': 'Replace',

  // --- Batch upload summary ---
  'batchUpload.heading': 'Resources added',
  'batchUpload.added': { one: '<strong>{count}</strong> resource added successfully', other: '<strong>{count}</strong> resources added successfully' },
  'batchUpload.skippedFormat': { one: '<strong>{count}</strong> skipped due to unsupported format', other: '<strong>{count}</strong> skipped due to unsupported format' },
  'batchUpload.skippedSubfolder': { one: '<strong>{count}</strong> skipped for being inside a subfolder', other: '<strong>{count}</strong> skipped for being inside a subfolder' },
  'batchUpload.unsupportedFormat': 'Unsupported format',
  'batchUpload.colFichero': 'File',
  'batchUpload.colMotivo': 'Reason',

  // --- Board/card background modals ---
  'boardColor.title': 'Configure background — Color',
  'boardColor.colorLabel': 'Color',
  'boardPattern.title': 'Configure background — Color and pattern',
  'boardPattern.configLegend': 'Configuration',
  'boardPattern.colorLegend': 'Color',
  'boardPattern.bgColorLabel': 'Background color',
  'boardPattern.patternColorLabel': 'Pattern color',
  'boardPattern.thicknessLabel': 'Thickness',
  'boardPattern.cellShapeLabel': 'Cell shape',
  'boardPattern.rowsLabel': 'Rows',
  'boardPattern.colsLabel': 'Columns',
  'boardImage.emptyFilter': 'No images match "{filter}".',
  'boardImage.empty': 'No images available',
  'boardImage.searchPlaceholder': 'Search image…',
  'cardBackgroundColor.title': 'Configure background color',
  'cardBackgroundColor.colorLabel': 'Background color',

  // --- Card shape modal ---
  'cardShape.title': 'Edit shape',
  'cardShape.typeLabel': 'Shape type',
  'cardShape.bgLegend': 'Background',
  'cardShape.bgTypeLabel': 'Background type',
  'cardShape.bgColorLabel': 'Background color',
  'cardShape.bgOpacityLabel': 'Transparency level',
  'cardShape.chooseImage': 'Choose image…',
  'cardShape.adjustImage': 'Adjust image…',
  'cardShape.borderColorLabel': 'Border color',
  'cardShape.borderWidthLabel': 'Thickness (px)',

  // --- Card text box modal ---
  'cardTextBox.title': 'Edit text box',
  'cardTextBox.contentLabel': 'Content',
  'cardTextBox.fontLabel': 'Typeface',
  'cardTextBox.chooseFont': 'Choose typeface',
  'cardTextBox.positionLabel': 'Text position within the box',
  'cardTextBox.sizeLabel': 'Font size',
  'cardTextBox.colorLabel': 'Color',
  'cardTextBox.styleLabel': 'Text style',
  'cardTextBox.borderColorLabel': 'Border color',
  'cardTextBox.borderWidthLabel': 'Thickness',
  'cardTextBox.borderTypeLabel': 'Line type',
  'cardTextBox.bgLegend': 'Background',
  'cardTextBox.bgColorLabel': 'Background color',
  'cardTextBox.bgOpacityLabel': 'Transparency level',

  // --- Visual editor ---
  'visualEditor.addElement': 'Add element ▾',
  'visualEditor.proportionLabel': 'Proportion',
  'visualEditor.roundedCornersLabel': 'Rounded corners',
  'visualEditor.adjustImage': 'Adjust image…',
  'visualEditor.borderTitle': 'Border',
  'visualEditor.borderColorLabel': 'Color',
  'visualEditor.borderWidthLabel': 'Thickness (px)',

  // --- Image adjust ---
  'imageAdjust.title': 'Adjust image',
  'imageAdjust.zoomLabel': 'Zoom',
  'imageAdjust.opacityLabel': 'Transparency',

  // --- Rotation ---
  'rotation.label': 'Rotation',

  // --- Choose typeface (die) ---
  'diceFont.title': 'Choose typeface',
  'diceFont.empty': 'No typefaces available',

  // --- Die result ---
  'diceResult.title': 'Result',

  // --- Deck content ---
  'mazoContent.title': 'Deck content',
  'mazoContent.hint': { one: '{id} — {count} card', other: '{id} — {count} cards' },
  'mazoContent.empty': 'This deck has no cards.',
  'mazoContent.draw': 'Draw',

  // --- Put into deck ---
  'insertIntoMazo.title': 'Put into deck...',
  'insertIntoMazo.mazoLabel': 'Target deck',
  'insertIntoMazo.positionLabel': 'Position within the deck',

  // --- Paste style (error) ---
  'styleClipboardError.heading': 'Could not paste the style',
  'styleClipboardError.message': 'The copied style references elements that no longer exist in the project. Nothing on this card has been changed.',
  'styleClipboardError.row.generales': 'General',
  'styleClipboardError.row.tag': 'Tag',
  'styleClipboardError.row.noLongerExists': '"{name}" no longer exists',
  'styleClipboardError.row.backgroundImage': 'Background image',
  'styleClipboardError.row.resourceGone': 'Resource no longer exists',
  'styleClipboardError.row.typefaceInTextBox': 'Typeface (text box "{box}")',
  'styleClipboardError.colElemento': 'Element',
  'styleClipboardError.colReferencia': 'Reference',
  'styleClipboardError.colDetalle': 'Detail',
  'interactionDef.rollDie': 'Roll die',
  'interactionDef.flipCard': 'Flip card',
  'interactionDef.drawTopCard': 'Draw top card',
  'componentModal.onClickLabel': 'Left click',
  'componentModal.interactionHelp': 'If you choose "None", clicking this component no longer "{action}" in Play Mode. The rest of its behavior (drag, context menu...) is unaffected.',

  // --- Copy style (selection) ---
  'styleClipboardSelection.title': 'Copy style',
  'styleClipboardSelection.hint': 'Choose what to copy. "Front face" and "Back face" include their whole design (image, border, transparency and text boxes).',
  'styleClipboardSelection.selectAllTitle': 'Card elements',
  'styleClipboardSelection.copy': 'Copy',
  'styleClipboardSelection.item.generales': 'General',
  'styleClipboardSelection.item.generalesHint': 'Locked, tooltip, raise on interact, tag',

  // --- Document viewer (render) ---
  'documentViewer.loadError': 'Could not load the content',

  // --- Property options (select) ---
  'option.bloqueado.ninguno': 'None',
  'option.bloqueado.juego': 'Only Play Mode',
  'option.bloqueado.todos': 'All modes',
  'option.orientacion.vertical': 'Vertical',
  'option.orientacion.horizontal': 'Horizontal',
  'option.forma.rectangular': 'Rectangular',
  'option.forma.circular': 'Circular',
  'option.disposicion.arriba': 'Top',
  'option.disposicion.abajo': 'Bottom',
  'option.disposicion.derecha': 'Right',
  'option.disposicion.izquierda': 'Left',
  'option.revelarCara.frontal': 'Face up',
  'option.revelarCara.trasera': 'Face down',
  'option.fondo.colorPatron': 'Color and pattern',
  'option.fondo.imagen': 'Image',
  'option.fondo.color': 'Color',
  'option.caras.numeroMaximo': 'Maximum number of faces',
  'option.caras.lista': 'Value list',
  'option.tipoContenido.texto': 'Text',
  'option.tipoContenido.url': 'URL',
  'option.formato.markdown': 'Markdown',
  'option.formato.html': 'HTML',
  'option.cara.frontal': 'Front face',
  'option.cara.trasera': 'Back face',
  'option.mazoPosicion.arriba': 'At the top',
  'option.mazoPosicion.abajo': 'At the bottom',
  'option.cellShape.cuadrada': 'Square',
  'option.cellShape.hexVertical': 'Hexagonal (vertices top/bottom)',
  'option.cellShape.hexHorizontal': 'Hexagonal (vertices left/right)',
  'option.lineType.continua': 'Solid',
  'option.lineType.punteada': 'Dotted',
  'option.cardShape.color': 'Color',
  'option.cardShape.imagen': 'Image',
  'option.cardShapeType.circulo': 'Circle / ellipse',
  'option.cardShapeType.cuadrado': 'Square',
  'option.cardShapeType.redondeado': 'Rounded rectangle',

  // --- Alignment / style (aria-label) ---
  'align.left': 'Align left',
  'align.centerH': 'Center horizontally',
  'align.right': 'Align right',
  'align.top': 'Align top',
  'align.centerV': 'Center vertically',
  'align.bottom': 'Align bottom',
  'align.bold': 'Bold',
  'align.italic': 'Italic',
  'align.underline': 'Underline',
  'align.marginTop': 'Top',
  'align.marginRight': 'Right',
  'align.marginBottom': 'Bottom',
  'align.marginLeft': 'Left',

  // --- Visual editor context menu ---
  'visualEditor.menu.copy': 'Copy',
  'visualEditor.menu.paste': 'Paste',
  'visualEditor.menu.delete': 'Delete',
  'visualEditor.menu.rotateCW': 'Rotate 90° (clockwise)',
  'visualEditor.menu.rotateCCW': 'Rotate 90° (counter-clockwise)',
  'visualEditor.menu.bringForward': 'Bring forward',
  'visualEditor.menu.sendBackward': 'Send backward',

  // --- Context menu (editMode / playMode) ---
  'menu.show': 'Show',
  'menu.hide': 'Hide',
  'menu.flipCard': 'Flip card',

  // --- Card proportions ---
  'cardProportion.poker-v': 'Standard poker portrait (5:7)',
  'cardProportion.poker-h': 'Standard poker landscape (7:5)',
  'cardProportion.tarot-v': 'Standard tarot portrait (70 × 120 mm)',
  'cardProportion.tarot-h': 'Standard tarot landscape (120 × 70 mm)',
  'cardProportion.square': 'Square (1:1)',
  'cardProportion.circular': 'Circular',
  'cardProportion.hex-vertical': 'Hexagonal (vertices top/bottom)',
  'cardProportion.hex-horizontal': 'Hexagonal (vertices left/right)',
  'cardProportion.triangle': 'Triangle',
  'cardProportion.triangle-inverted': 'Inverted triangle',
  'cardProportion.free': 'Free (free resize)',

  // --- Native confirmations (confirm) ---
  'confirm.deleteComponent': 'Delete component "{id}"?',
  'confirm.deleteResource': 'Delete resource "{name}"?',
  'confirm.deleteTag': 'Delete tag "{name}"?',
  'confirm.syncCopies': 'Sync the {count} copies of "{id}"?',

  // --- Common (fix 00245) ---
  'common.name': 'Name',
  'common.actions': 'Actions',
  'common.yes': 'Yes',
  'common.no': 'No',
  'common.border': 'Border',
  'common.chooseImage': 'Choose image',
  'common.fontDefault': 'Default',

  // --- Panel table headers ---
  'componentList.col.orden': 'Order',
  'componentList.col.id': 'Id',
  'componentList.col.tipo': 'Type',
  'componentList.col.copia': 'Copy',
  'componentList.groupRowType': 'Group',
  'resourceList.col.usos': 'Uses',
  'resourceList.col.tipo': 'Type',
  'tagList.col.elementos': 'Elements',

  // --- "+ Add resource" menu ---
  'resourceList.addMenu.file': 'Upload file',
  'resourceList.addMenu.multiple': 'Upload several files',
  'resourceList.addMenu.folder': 'Upload folder',
  'resourceList.addMenu.folderNote': 'Only the top level of the folder is considered',

  // --- Component modal: title and tabs ---
  'componentModal.propsTitle': 'Edit component properties',
  'componentModal.createTitle': 'Create component',
  'componentModal.tab.general': 'General',
  'componentModal.tab.visual': 'Visual',
  'componentModal.tab.specific': 'Specific',
  'componentModal.tab.copias': 'Copies',
  'componentModal.borderLegend.extrusion': 'Extrusion',
  'componentModal.designBoardTitle': 'Design custom board',
  'componentModal.designCardTitle': 'Design card',
  'componentModal.pasteStyleDisabledTitle': 'Paste style (nothing copied)',

  // --- Deck reveal zone ---
  'mazo.revealZone.default': 'Revealed card',

  // --- Type names in the component identifier ---
  'componentIdentifier.type.texto': 'Text',
  'componentIdentifier.type.tableroSimple': 'Simple board',
  'componentIdentifier.type.dado': 'Configurable die',
  'componentIdentifier.type.documento': 'Document',
  'componentIdentifier.type.carta': 'Card/Token',
  'componentIdentifier.type.mazo': 'Deck',

  // --- Context menu: tag select ---
  'contextMenu.tagSelect.empty': 'No tags',
  'contextMenu.tagSelect.placeholder': 'Choose tag…',

  // --- Selection checklist (export/import) ---
  'elementSelection.block.components': 'Components',
  'elementSelection.block.resources': 'Resources',
  'elementSelection.block.tags': 'Tags',

  // --- Import report ---
  'importReport.col.component': 'Affected component',
  'importReport.col.error': 'Error',
  'importReport.col.solution': 'Solution',
  'importReport.col.element': 'Wrong/missing element',
  'importReport.errorType.recurso': 'Resource not included',
  'importReport.errorType.etiqueta': 'Tag not included',
  'importReport.errorType.etiquetaDuplicada': 'Duplicate tag name',
  'importReport.solution.tagRenamed': 'The imported tag was renamed to avoid a duplicate name',
  'importReport.solution.componentWithoutResource': 'The component was added without that resource',
  'importReport.solution.tagLinkedToExisting': 'Linked to an existing tag with the same name instead of creating a duplicate',
  'importReport.solution.tagAutoCreated': 'The tag was created automatically',

  // --- Token conversion errors ---
  'fichaMigration.error.missingDesign': 'Missing design configuration (properties)',
  'fichaMigration.error.missingShape': 'Missing token shape',
  'fichaMigration.error.unknownShape': 'Unrecognized shape',
  'fichaMigration.error.incompleteImageAdjust': 'Image adjustment with incomplete data',

  // --- Import file parse error ---
  'persistence.importParseError': 'The file does not contain a valid component list.',

  // --- Image resource editor: zoom buttons ---
  'resourceModal.zoom.in': 'Zoom in',
  'resourceModal.zoom.out': 'Zoom out',
  'resourceModal.zoom.reset': 'Reset view',

  // --- Duplicate resource replace modal ---
  'resourceReplace.titleSingle': 'Duplicate resource',
  'resourceReplace.titleMulti': 'Duplicate resources',

  // --- Tag modal: title ---
  'tagModal.editTitle': 'Tag: {name}',
  'tagModal.newTitle': 'New tag',

  // --- Visual editor: "Add element" menu, maximize, face ---
  'visualEditor.addMenu.bgImage': 'Background image…',
  'visualEditor.addMenu.bgColor': 'Background color…',
  'visualEditor.addMenu.textBox': 'Text box',
  'visualEditor.addMenu.shape': 'Geometric shape',
  'visualEditor.maximize': 'Maximize',
  'visualEditor.restore': 'Restore size',
  'visualEditor.faceDefault': 'Design',

  // --- Contextual help texts ("?" icon) ---
  'help.lockedField': 'Sets in which mode(s) this component cannot be moved. \'All modes\' also locks it in Edit Mode; \'Play mode only\' locks it only during the game (previous default behavior); \'None\' lets you drag it freely in both.',
  'help.hiddenField': 'When checked, this component stops appearing at all in Play Mode (not shown, takes no space, not interactable). In Edit Mode it still shows normally, with a badge indicating it will not appear in the game.',
  'help.raiseOnMove': 'When checked, this component is automatically placed on top of all others every time it is moved or interacted with (flip, roll) in Play Mode.',
  'help.showTitle': 'When checked, this component shows a label in its top-left corner in Play Mode, with the content and colors configured in "Edit component title…".',
  'help.showTooltip': 'When checked, this component shows help on hover in Play Mode: the \'Help\' text if it has content, or its identifier if empty.',
  'help.playerHelpText': 'Text the player sees as help. Supports multiple lines, basic HTML tags: <b>/<strong> (bold), <i>/<em> (italic), <u> (underline), <br> (line break), <ul>/<ol>/<li> (lists), and variables like {cards_current} (current card count, deck only). If left empty, the component identifier is used.',
  'help.extrusionNoEffectOnText': 'Extrusion has no visual effect on components of type \'Text\', whether or not a background color is set.',
  'help.rightClickNone': 'If you choose "None", right-clicking this component does nothing in Play Mode (you cannot lock/unlock it or reach its type-specific actions from there). The rest of the interactions are unaffected.',
  'help.desyncOculto': 'When checked or unchecked, all copies of this object are unsynced and their \'Hidden\' takes this value immediately.',
  'help.copySync': 'When checked, this copy\'s "Locked" and "Hidden" always follow the original\'s value. Uncheck it to set a value of its own for this copy, independent of the original.',
  'help.group.lockedField': 'Sets in which mode(s) the members of this group cannot be moved, while the grouping lasts. \'All modes\' also locks it in Edit Mode; \'Play mode only\' locks it only during the game; \'None\' lets you drag them freely in both.',
  'help.group.hiddenField': 'When checked, all members of this group stop appearing at all in Play Mode while the grouping lasts. In Edit Mode they still show normally, with a badge indicating they will not appear in the game.',
  'help.group.showTooltip': 'When checked, the members of this group show their identifier as a tooltip on hover, but only in Play Mode.',
  'help.group.showTitle': 'When checked, the members of this group show their component title (configured individually on each one) in Play Mode.',
  'help.group.raiseOnMove': 'When checked, the members of this group are automatically placed on top of all others every time they are moved or interacted with in Play Mode.',
  'help.componentTitleText': 'The label text. Supports multiple lines and basic HTML tags: <b>/<strong> (bold), <i>/<em> (italic), <u> (underline), <br> (line break), <ul>/<ol>/<li> (lists). Supports variables like {cards_current} (current card count, deck only) — on other types it is shown literally.',
};

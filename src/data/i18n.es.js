// Catálogo de textos en español. DATOS PUROS: pares clave -> texto, sin lógica
// ni imports. Referencia canónica del sistema i18n: debe estar completo.
// Las entradas con forma { one, other } son plurales (t() elige según params.count).

export const CATALOG_ES = {
  // --- App / documento ---
  'app.documentTitle': 'BG Factory',
  'appVersion.repoLink': 'Ver en Github',

  // --- Toasts de arranque ---
  'toast.stateRecoverFailedVersion': 'No se ha podido recuperar el estado de una versión anterior; se ha empezado con el contenido por defecto.',
  'toast.stateRecoverFailedCorrupt': 'No se ha podido recuperar el estado guardado.',

  // --- Recursos semilla ---
  'defaultResource.exampleImage': 'Ejemplo imagen',
  'defaultResource.exampleFont': 'Ejemplo tipografía',

  // --- Comunes ---
  'common.accept': 'Aceptar',
  'common.cancel': 'Cancelar',
  'common.close': 'Cerrar',
  'common.save': 'Guardar',
  'common.delete': 'Eliminar',
  'common.edit': 'Editar',
  'common.create': 'Crear',
  'common.duplicate': 'Duplicar',
  'common.comingSoon': 'Próximamente',
  'common.transparent': 'Transparente',
  'common.color': 'Color',
  'common.none.f': 'Ninguna',
  'common.none.m': 'Ninguno',
  'common.general': 'General',
  'common.visual': 'Efecto',
  'common.background': 'Fondo',
  'common.content': 'Contenido',
  'common.clearSearch': 'Limpiar búsqueda',

  // --- Barra de controles superior ---
  'toolbar.modeEdit': 'Modo Edición',
  'toolbar.modePlay': 'Modo Juego',
  'toolbar.import': 'Importar',
  'toolbar.export': 'Exportar',
  'toolbar.fitZoom': 'Ajustar zoom para ver todos los elementos',
  'toolbar.fitZoom.aria': 'Ajustar zoom',
  'toolbar.settings': 'Configuración',

  // --- Menú de exportación ---
  'export.menu.gameJson': 'Exportar juego (.json)',
  'export.menu.resourcesZip': 'Exportar recursos (.zip)',
  'export.menu.productionCsv': 'Exportar hoja de producción (.csv)',

  // --- Import ---
  'import.error.title': 'No se ha podido importar el fichero',
  'import.error.body': 'El fichero seleccionado no contiene un listado de componentes válido.',
  'import.progress': 'Importando…',
  'import.confirm.title': 'Importar — confirmar',
  'import.confirm.modeLabel': 'Modo de importación',
  'import.confirm.mode.overwrite': 'Sobrescribir todo el juego',
  'import.confirm.mode.add': 'Añadir a lo existente',
  'import.confirm.conflictLabel': 'Comportamiento ante id duplicado',
  'import.confirm.conflict.overwrite': 'Sobrescribir el existente',
  'import.confirm.conflict.keepBoth': 'Mantener ambos',
  'import.confirm.accept': 'Importar',
  'import.selection.title': 'Importar — elegir elementos',
  'import.selection.continue': 'Continuar',
  'import.report.title': 'Informe de importación',
  'import.conversionError.heading': 'Errores al convertir fichas',
  'import.conversionError.message': 'Se han detectado errores al convertir las siguientes fichas a Carta/Ficha. Puedes continuar la importación sin ellas, o abortarla por completo.',
  'import.conversionError.abort': 'Abortar importación',
  'import.conversionError.continue': 'Continuar sin esas fichas',
  'import.conversionError.colFicha': 'Ficha afectada',
  'import.conversionError.colError': 'Error',

  // --- Export ---
  'export.selection.title': 'Exportar',
  'export.selection.nameLabel': 'Nombre de fichero',
  'export.selection.accept': 'Exportar',

  // --- Tipos de componente ---
  'componentType.texto': 'Cuadro de texto',
  'componentType.tableroSimple': 'Tablero simple',
  'componentType.tableroPersonalizado': 'Tablero personalizado',
  'componentType.dado': 'Dado Configurable',
  'componentType.documento': 'Visor de documentos',
  'componentType.carta': 'Carta/Ficha',
  'componentType.mazo': 'Mazo',

  // --- Modal "Añadir componente" ---
  'componentTypeModal.title': 'Añadir componente',

  // --- Panel de componentes ---
  'componentList.empty': 'No hay componentes todavía.',
  'componentList.emptyFilter': 'No hay componentes que coincidan con «{filter}».',
  'componentList.title': 'Componentes ({count})',
  'componentList.add': '+ Añadir componente',
  'componentList.filterPlaceholder': 'Filtrar componentes…',
  'componentList.ungroup': 'Desagrupar',

  // --- Panel de recursos ---
  'resourceList.empty': 'No hay recursos todavía.',
  'resourceList.emptyFilter': 'No hay recursos que coincidan con «{filter}».',
  'resourceList.title': 'Recursos ({count})',
  'resourceList.add': '+ Añadir recurso ▾',
  'resourceList.filterPlaceholder': 'Filtrar recursos…',

  // --- Panel de etiquetas ---
  'tagList.empty': 'No hay etiquetas todavía.',
  'tagList.emptyFilter': 'No hay etiquetas que coincidan con «{filter}».',
  'tagList.title': 'Etiquetas ({count})',
  'tagList.add': '+ Añadir etiqueta',
  'tagList.filterPlaceholder': 'Filtrar etiquetas…',

  // --- Menú de columna ---
  'columnMenu.filter': 'Filtrar',
  'columnMenu.all': 'Todos',
  'columnMenu.sortAsc': 'Ordenar A..Z',
  'columnMenu.sortDesc': 'Ordenar Z..A',

  // --- Menú contextual ---
  'contextMenu.interactions': 'Interacciones',
  'contextMenu.show': 'Mostrar',
  'contextMenu.hide': 'Ocultar',
  'contextMenu.clone': 'Clonar',
  'contextMenu.copy': 'Copiar',
  'contextMenu.delete': 'Eliminar',
  'contextMenu.group': 'Agrupar',
  'contextMenu.ungroup': 'Desagrupar',
  'contextMenu.flipCard': 'Voltear carta',
  'contextMenu.addToTag': 'Añadir a etiqueta',
  'contextMenu.shuffle': 'Barajar',
  'contextMenu.viewContent': 'Ver contenido...',
  'contextMenu.insertIntoMazo': 'Meter en mazo...',
  'contextMenu.lock': 'Bloquear',
  'contextMenu.unlock': 'Desbloquear',
  'contextMenu.extra.faces': { one: '{count} cara', other: '{count} caras' },
  'contextMenu.extra.cards': { one: '{count} carta', other: '{count} cartas' },

  // --- Interacciones (play mode) ---
  'interaction.leftClick': 'Clic izquierdo',
  'interaction.doubleLeftClick': 'Doble clic izquierdo',
  'interaction.rightClick': 'Clic derecho',
  'interaction.value.none': 'Ninguno',
  'interaction.value.openThisMenu': 'Abrir este menú',
  'interaction.value.rollDie': 'Lanzar el dado',
  'interaction.value.viewResultLarge': 'Ver el resultado en grande',
  'interaction.value.flipCard': 'Voltear la carta',
  'interaction.value.drawTopCard': 'Sacar la carta de arriba',

  // --- Progreso ---
  'progress.grouping': { one: 'Agrupando {count} elemento…', other: 'Agrupando {count} elementos…' },
  'progress.ungrouping': { one: 'Desagrupando {count} elemento…', other: 'Desagrupando {count} elementos…' },
  'progress.addingToMazo': { one: 'Añadiendo {count} carta al mazo…', other: 'Añadiendo {count} cartas al mazo…' },

  // --- Toasts varios ---
  'toast.copiesSynced': 'Copias sincronizadas',
  'toast.copiesDesynced': 'Copias desincronizadas',
  'toast.styleCopied': 'Estilo copiado',
  'toast.tagAdded': 'Etiqueta añadida',

  // --- Errores varios ---
  'error.generic.title': 'Error',
  'error.notice.title': 'Aviso',
  'error.unsupportedFileFormat': 'Formato de fichero no soportado.',
  'error.noValidResourceInFolder': 'No se ha encontrado ningún recurso válido en la carpeta seleccionada.',
  'error.resourceInUse': 'El recurso "{name}" está en uso por: {ids} y no se puede eliminar.',

  // --- Confirmación de borrado múltiple ---
  'bulkDelete.title': { one: 'Eliminar {count} componente', other: 'Eliminar {count} componentes' },
  'bulkDelete.message': 'Se van a eliminar los siguientes elementos:',

  // --- Confirmación de borrado de etiqueta en uso ---
  'tagDelete.title': 'Eliminar etiqueta en uso',
  'tagDelete.message': 'La etiqueta "{name}" está siendo usada por los siguientes elementos. Si continúas, se eliminará la etiqueta y esos elementos perderán la pertenencia a esta etiqueta.',

  // --- Modal de configuración ---
  'settings.title': 'Configuración',
  'settings.language.label': 'Idioma',
  'settings.tableText.label': 'Texto en la mesa',
  'settings.tableText.hint': 'Aparece en la esquina inferior derecha de la mesa, encima de la versión. Solo texto plano.',
  'settings.version.label': 'Versión',

  // --- Modal de componente ---
  'componentModal.idLabel': 'ID del componente',
  'componentModal.sizeLegend': 'Tamaño',
  'componentModal.heightLabel': 'Alto (px)',
  'componentModal.widthLabel': 'Ancho (px)',
  'componentModal.keepRatio': 'Mantener proporción',
  'componentModal.locked': 'Bloqueado',
  'componentModal.hidden': 'Oculto',
  'componentModal.raiseOnMove': 'Subir al mover/interactuar',
  'componentModal.playerHelp': 'Ayuda jugador',
  'componentModal.showTitle': 'Mostrar título de componente',
  'componentModal.editTitle': 'Editar título de componente…',
  'componentModal.showTooltip': 'Mostrar ayuda',
  'componentModal.tooltipText': 'Ayuda',
  'componentModal.styleLegend': 'Estilo',
  'componentModal.extrusionLegend': 'Extrusión',
  'componentModal.depthLabel': 'Profundidad (px)',
  'componentModal.extrusionColor': 'Color de extrusión',
  'componentModal.tagsLegend': 'Etiquetas',
  'componentModal.createNewTag': '+ Crear nueva etiqueta…',
  'componentModal.tagNameEmpty': 'El nombre no puede estar vacío',
  'componentModal.tagNameTaken': 'Ya existe una etiqueta con este nombre',
  'componentModal.tagNamePlaceholder': 'Nombre de la etiqueta nueva',
  'componentModal.programmedInteractions': 'Interacciones programadas',
  'componentModal.rightClickLabel': 'Click derecho',
  'componentModal.rightClick.openContextMenu': 'Abrir menú contextual',
  'componentModal.idEmpty': 'El ID no puede estar vacío',
  'componentModal.idTaken': 'Ya existe otro componente con este ID',
  'componentModal.noCopies': 'Este objeto no tiene copias.',
  'componentModal.copiesCount': 'Copias: {count}',
  'componentModal.viewLinkedCopies': 'Ver copias vinculadas...',
  'componentModal.syncAllCopies': 'Sincronizar todas las copias',
  'componentModal.desyncAllCopies': 'Desincronizar todas las copias',
  'componentModal.fontSizeLabel': 'Tamaño de fuente (px)',
  'componentModal.textColor': 'Color de texto',
  'componentModal.bgColor': 'Color de fondo',
  'componentModal.noSpecificProps': 'Sin propiedades específicas',
  'componentModal.noProps': 'Este objeto no tiene propiedades',
  'componentModal.bevel': 'Biselado en el borde',
  'componentModal.shadow': 'Sombra',
  'componentModal.borderColor': 'Color del borde',
  'componentModal.borderWidth': 'Grosor',
  'componentModal.configureBackground': 'Configurar fondo',
  'componentModal.bodyColor': 'Color del cuerpo',
  'componentModal.numbersColor': 'Color de los números',
  'componentModal.facesConfig': 'Configuración de caras',
  'componentModal.maxNumber': 'Número máximo',
  'componentModal.valueList': 'Lista de valores (separados por comas)',
  'componentModal.valueListError': 'La lista necesita al menos 2 valores, y al menos uno no puede estar vacío',
  'componentModal.fontTypeLabel': 'Tipo de fuente',
  'componentModal.chooseFont': 'Elegir tipografía',
  'componentModal.contentTypeLabel': 'Tipo de contenido',
  'componentModal.formatLabel': 'Formato',
  'componentModal.pageUrlLabel': 'URL de la página',
  'componentModal.editBoardDesign': 'Editar diseño del tablero',
  'componentModal.proportionLabel': 'Proporción',
  'componentModal.editCardDesign': 'Editar diseño de la carta',
  'componentModal.cardStyleLegend': 'Estilo de la carta',
  'componentModal.copyStyle': 'Copiar estilo',
  'componentModal.pasteStyle': 'Pegar estilo',
  'componentModal.styleHint': 'Copia/pega solo los elementos que elijas: generales (incluye la etiqueta), proporción, cara frontal y/o cara trasera.',
  'componentModal.cardsCount': { one: '{count} carta', other: '{count} cartas' },
  'componentModal.shapeLegend': 'Forma',
  'componentModal.shapeLabel': 'Forma',
  'componentModal.orientationLabel': 'Orientación',
  'componentModal.revealedCardsLegend': 'Cartas reveladas',
  'componentModal.revealDisposition': 'Disposición carta revelada',
  'componentModal.revealDispositionNote': 'Lado del mazo donde aparecen las cartas al sacarlas',
  'componentModal.revealedCardText': 'Texto carta revelada',
  'componentModal.revealCard': 'Revelar carta',
  'componentModal.imageLegend': 'Imagen',
  'componentModal.chooseImage': 'Elegir imagen…',
  'componentModal.adjustImage': 'Ajustar imagen…',
  'componentModal.removeImage': 'Quitar imagen',
  'componentModal.viewMazoContent': 'Ver contenido del mazo',

  // --- Copias de un componente ---
  'componentCopies.title': 'Copias vinculadas',
  'componentCopies.hint': { one: '{id} — {count} copia', other: '{id} — {count} copias' },
  'componentCopies.idHeader': 'Id',
  'componentCopies.syncHeader': 'Sincronizada',

  // --- Modal de copia (solo lectura) ---
  'copyComponent.title': 'Propiedades del componente',
  'copyComponent.idLabel': 'ID del componente',
  'copyComponent.notice': 'Este componente es una copia de otro elemento. Sus propiedades no se pueden editar aquí: se sincronizan automáticamente con el original.',
  'copyComponent.synced': 'Sincronizado',
  'copyComponent.lockedHiddenLegend': 'Bloqueado / Oculto',
  'copyComponent.originalLabel': 'Elemento original',

  // --- Modal de título de componente ---
  'componentTitleModal.title': 'Editar título de componente',
  'componentTitleModal.textColor': 'Color del texto',
  'componentTitleModal.bgColor': 'Color de fondo',
  'componentTitleModal.bgOpacity': 'Transparencia del fondo',

  // --- Modal de grupo ---
  'groupModal.title': 'Propiedades del grupo',
  'groupModal.idLabel': 'Id del grupo',
  'groupModal.idEmpty': 'El ID no puede estar vacío',
  'groupModal.idTaken': 'Ya existe otro grupo con este ID',
  'groupModal.showTooltip': 'Mostrar tooltip',

  // --- Modal de etiqueta ---
  'tagModal.nameLabel': 'Nombre',
  'tagModal.elementsLabel': 'Elementos de la etiqueta ({count})',
  'tagModal.empty': 'No hay elementos en esta etiqueta.',
  'tagModal.remove': 'Sacar',
  'tagModal.groupLabel': 'Grupo:',
  'tagModal.nameEmpty': 'El nombre no puede estar vacío',
  'tagModal.nameTaken': 'Ya existe una etiqueta con este nombre',

  // --- Modal de recurso ---
  'resourceKind.image': 'Imagen',
  'resourceKind.font': 'Tipografía',
  'resourceModal.title': 'Recurso: {kind} — {name}',
  'resourceModal.nameLabel': 'Nombre del recurso',
  'resourceModal.previewLabel': 'Vista previa',
  'resourceModal.zoomPanHint': 'Rueda del ratón para hacer zoom · arrastrar para mover la imagen',
  'resourceModal.changeImage': 'Cambiar imagen...',
  'resourceModal.acceptChanges': 'Aceptar cambios',
  'resourceModal.closeWindow': 'Cerrar ventana',
  'resourceModal.fontSample': 'BG Factory sample — ABCDEFGHIJKLMÑ abcdefghijklmñ 0123456789',

  // --- Confirmación de reemplazo de recurso ---
  'resourceReplace.messageSingle': 'Ya existe un recurso llamado "{name}". Si continúas, se reemplazará su contenido. Los componentes que ya lo usan pasarán a mostrar el recurso nuevo.',
  'resourceReplace.introMulti': '{count} de los ficheros seleccionados coinciden con recursos ya existentes en la galería:',
  'resourceReplace.outro': 'Si continúas, se reemplazará su contenido. El resto de ficheros sin conflicto se añadirán con normalidad.',
  'resourceReplace.replace': 'Reemplazar',

  // --- Resumen de subida por lotes ---
  'batchUpload.heading': 'Recursos añadidos',
  'batchUpload.added': { one: '<strong>{count}</strong> recurso añadido correctamente', other: '<strong>{count}</strong> recursos añadidos correctamente' },
  'batchUpload.skippedFormat': { one: '<strong>{count}</strong> omitido por formato no soportado', other: '<strong>{count}</strong> omitidos por formato no soportado' },
  'batchUpload.skippedSubfolder': { one: '<strong>{count}</strong> omitido por estar dentro de una subcarpeta', other: '<strong>{count}</strong> omitidos por estar dentro de una subcarpeta' },
  'batchUpload.unsupportedFormat': 'Formato no soportado',
  'batchUpload.colFichero': 'Fichero',
  'batchUpload.colMotivo': 'Motivo',

  // --- Modales de fondo de tablero/carta ---
  'boardColor.title': 'Configurar fondo — Color',
  'boardColor.colorLabel': 'Color',
  'boardPattern.title': 'Configurar fondo — Color y patrón',
  'boardPattern.configLegend': 'Configuración',
  'boardPattern.colorLegend': 'Color',
  'boardPattern.bgColorLabel': 'Color de fondo',
  'boardPattern.patternColorLabel': 'Color del patrón',
  'boardPattern.thicknessLabel': 'Grosor',
  'boardPattern.cellShapeLabel': 'Forma de casilla',
  'boardPattern.rowsLabel': 'Filas',
  'boardPattern.colsLabel': 'Columnas',
  'boardImage.emptyFilter': 'No hay imágenes que coincidan con «{filter}».',
  'boardImage.empty': 'No hay imágenes disponibles',
  'boardImage.searchPlaceholder': 'Buscar imagen…',
  'cardBackgroundColor.title': 'Configurar color de fondo',
  'cardBackgroundColor.colorLabel': 'Color de fondo',

  // --- Modal de figura de carta ---
  'cardShape.title': 'Editar figura',
  'cardShape.typeLabel': 'Tipo de figura',
  'cardShape.bgLegend': 'Fondo',
  'cardShape.bgTypeLabel': 'Tipo de fondo',
  'cardShape.bgColorLabel': 'Color de fondo',
  'cardShape.bgOpacityLabel': 'Nivel de transparencia',
  'cardShape.chooseImage': 'Elegir imagen…',
  'cardShape.adjustImage': 'Ajustar imagen…',
  'cardShape.borderColorLabel': 'Color del borde',
  'cardShape.borderWidthLabel': 'Grosor (px)',

  // --- Modal de cuadro de texto de carta ---
  'cardTextBox.title': 'Editar cuadro de texto',
  'cardTextBox.contentLabel': 'Contenido',
  'cardTextBox.fontLabel': 'Tipografía',
  'cardTextBox.chooseFont': 'Elegir tipografía',
  'cardTextBox.positionLabel': 'Posición del texto en el cuadro',
  'cardTextBox.sizeLabel': 'Tamaño de fuente',
  'cardTextBox.colorLabel': 'Color',
  'cardTextBox.styleLabel': 'Estilo de texto',
  'cardTextBox.borderColorLabel': 'Color del borde',
  'cardTextBox.borderWidthLabel': 'Grosor',
  'cardTextBox.borderTypeLabel': 'Tipo de línea',
  'cardTextBox.bgLegend': 'Fondo',
  'cardTextBox.bgColorLabel': 'Color de fondo',
  'cardTextBox.bgOpacityLabel': 'Nivel de transparencia',

  // --- Editor visual ---
  'visualEditor.addElement': 'Añadir elemento ▾',
  'visualEditor.proportionLabel': 'Proporción',
  'visualEditor.roundedCornersLabel': 'Esquinas redondeadas',
  'visualEditor.adjustImage': 'Ajustar imagen…',
  'visualEditor.borderTitle': 'Borde',
  'visualEditor.borderColorLabel': 'Color',
  'visualEditor.borderWidthLabel': 'Grosor (px)',

  // --- Ajuste de imagen ---
  'imageAdjust.title': 'Ajustar imagen',
  'imageAdjust.zoomLabel': 'Zoom',
  'imageAdjust.opacityLabel': 'Transparencia',

  // --- Rotación ---
  'rotation.label': 'Rotación',

  // --- Elegir tipografía (dado) ---
  'diceFont.title': 'Elegir tipografía',
  'diceFont.empty': 'No hay tipografías disponibles',

  // --- Resultado del dado ---
  'diceResult.title': 'Resultado',

  // --- Contenido del mazo ---
  'mazoContent.title': 'Contenido del mazo',
  'mazoContent.hint': { one: '{id} — {count} carta', other: '{id} — {count} cartas' },
  'mazoContent.empty': 'Este mazo no tiene cartas.',
  'mazoContent.draw': 'Sacar',

  // --- Meter en mazo ---
  'insertIntoMazo.title': 'Meter en mazo...',
  'insertIntoMazo.mazoLabel': 'Mazo de destino',
  'insertIntoMazo.positionLabel': 'Posición dentro del mazo',

  // --- Pegar estilo (error) ---
  'styleClipboardError.heading': 'No se pudo pegar el estilo',
  'styleClipboardError.message': 'El estilo copiado hace referencia a elementos que ya no existen en el proyecto. No se ha modificado nada de esta carta.',
  'styleClipboardError.row.generales': 'Generales',
  'styleClipboardError.row.tag': 'Etiqueta',
  'styleClipboardError.row.noLongerExists': '"{name}" ya no existe',
  'styleClipboardError.row.backgroundImage': 'Imagen de fondo',
  'styleClipboardError.row.resourceGone': 'Recurso ya no existe',
  'styleClipboardError.row.typefaceInTextBox': 'Tipografía (cuadro de texto "{box}")',
  'styleClipboardError.colElemento': 'Elemento',
  'styleClipboardError.colReferencia': 'Referencia',
  'styleClipboardError.colDetalle': 'Detalle',
  'interactionDef.rollDie': 'Lanzar dado',
  'interactionDef.flipCard': 'Voltear carta',
  'interactionDef.drawTopCard': 'Sacar carta de arriba',
  'componentModal.onClickLabel': 'Click izquierdo',
  'componentModal.interactionHelp': 'Si eliges "Ninguna", el click sobre este componente deja de "{action}" en Modo Juego. El resto de su comportamiento (arrastre, menú contextual...) no se ve afectado.',

  // --- Copiar estilo (selección) ---
  'styleClipboardSelection.title': 'Copiar estilo',
  'styleClipboardSelection.hint': 'Elige qué copiar. "Cara frontal" y "Cara trasera" incluyen todo su diseño (imagen, borde, transparencia y cuadros de texto).',
  'styleClipboardSelection.selectAllTitle': 'Elementos de la carta',
  'styleClipboardSelection.copy': 'Copiar',
  'styleClipboardSelection.item.generales': 'Generales',
  'styleClipboardSelection.item.generalesHint': 'Bloqueado, tooltip, subir al interactuar, etiqueta',

  // --- Visor de documentos (render) ---
  'documentViewer.loadError': 'No se pudo cargar el contenido',

  // --- Opciones de propiedades (select) ---
  'option.bloqueado.ninguno': 'Ninguno',
  'option.bloqueado.juego': 'Solo modo juego',
  'option.bloqueado.todos': 'Todos los modos',
  'option.orientacion.vertical': 'Vertical',
  'option.orientacion.horizontal': 'Horizontal',
  'option.forma.rectangular': 'Rectangular',
  'option.forma.circular': 'Circular',
  'option.disposicion.arriba': 'Arriba',
  'option.disposicion.abajo': 'Abajo',
  'option.disposicion.derecha': 'Derecha',
  'option.disposicion.izquierda': 'Izquierda',
  'option.revelarCara.frontal': 'Boca arriba',
  'option.revelarCara.trasera': 'Boca abajo',
  'option.fondo.colorPatron': 'Color y patrón',
  'option.fondo.imagen': 'Imagen',
  'option.fondo.color': 'Color',
  'option.caras.numeroMaximo': 'Número máximo de caras',
  'option.caras.lista': 'Lista de valores',
  'option.tipoContenido.texto': 'Texto',
  'option.tipoContenido.url': 'URL',
  'option.formato.markdown': 'Markdown',
  'option.formato.html': 'HTML',
  'option.cara.frontal': 'Cara frontal',
  'option.cara.trasera': 'Cara trasera',
  'option.mazoPosicion.arriba': 'Arriba del todo',
  'option.mazoPosicion.abajo': 'Abajo del todo',
  'option.cellShape.cuadrada': 'Cuadrada',
  'option.cellShape.hexVertical': 'Hexagonal (vértices arriba/abajo)',
  'option.cellShape.hexHorizontal': 'Hexagonal (vértices izquierda/derecha)',
  'option.lineType.continua': 'Continua',
  'option.lineType.punteada': 'Punteada',
  'option.cardShape.color': 'Color',
  'option.cardShape.imagen': 'Imagen',
  'option.cardShapeType.circulo': 'Círculo / elipse',
  'option.cardShapeType.cuadrado': 'Cuadrado',
  'option.cardShapeType.redondeado': 'Rectángulo redondeado',

  // --- Alineación / estilo (aria-label) ---
  'align.left': 'Alinear a la izquierda',
  'align.centerH': 'Centrar horizontalmente',
  'align.right': 'Alinear a la derecha',
  'align.top': 'Alinear arriba',
  'align.centerV': 'Centrar verticalmente',
  'align.bottom': 'Alinear abajo',
  'align.bold': 'Negrita',
  'align.italic': 'Cursiva',
  'align.underline': 'Subrayado',
  'align.marginTop': 'Arriba',
  'align.marginRight': 'Derecha',
  'align.marginBottom': 'Abajo',
  'align.marginLeft': 'Izquierda',

  // --- Menú contextual del editor visual ---
  'visualEditor.menu.copy': 'Copiar',
  'visualEditor.menu.paste': 'Pegar',
  'visualEditor.menu.delete': 'Eliminar',
  'visualEditor.menu.rotateCW': 'Girar 90° (horario)',
  'visualEditor.menu.rotateCCW': 'Girar 90° (antihorario)',
  'visualEditor.menu.bringForward': 'Colocar arriba',
  'visualEditor.menu.sendBackward': 'Colocar abajo',

  // --- Menú contextual (editMode / playMode) ---
  'menu.show': 'Mostrar',
  'menu.hide': 'Ocultar',
  'menu.flipCard': 'Voltear carta',

  // --- Proporciones de carta ---
  'cardProportion.poker-v': 'Poker estándar vertical (5:7)',
  'cardProportion.poker-h': 'Poker estándar horizontal (7:5)',
  'cardProportion.tarot-v': 'Tarot estándar vertical (70 × 120 mm)',
  'cardProportion.tarot-h': 'Tarot estándar horizontal (120 × 70 mm)',
  'cardProportion.square': 'Cuadrada (1:1)',
  'cardProportion.circular': 'Circular',
  'cardProportion.hex-vertical': 'Hexagonal (vértices arriba/abajo)',
  'cardProportion.hex-horizontal': 'Hexagonal (vértices izquierda/derecha)',
  'cardProportion.triangle': 'Triángulo',
  'cardProportion.triangle-inverted': 'Triángulo invertido',
  'cardProportion.free': 'Libre (redimensionamiento libre)',

  // --- Confirmaciones nativas (confirm) ---
  'confirm.deleteComponent': '¿Eliminar el componente "{id}"?',
  'confirm.deleteResource': '¿Eliminar el recurso "{name}"?',
  'confirm.deleteTag': '¿Eliminar la etiqueta "{name}"?',
  'confirm.syncCopies': '¿Sincronizar las {count} copias de "{id}"?',

  // --- Comunes (fix 00245) ---
  'common.name': 'Nombre',
  'common.actions': 'Acciones',
  'common.yes': 'Sí',
  'common.no': 'No',
  'common.border': 'Borde',
  'common.chooseImage': 'Elegir imagen',
  'common.fontDefault': 'Por defecto',

  // --- Cabeceras de tabla de paneles ---
  'componentList.col.orden': 'Orden',
  'componentList.col.id': 'Id',
  'componentList.col.tipo': 'Tipo',
  'componentList.col.copia': 'Copia',
  'componentList.groupRowType': 'Grupo',
  'componentList.expandGroup': 'Desplegar grupo',
  'componentList.collapseGroup': 'Plegar grupo',
  'resourceList.col.usos': 'Usos',
  'resourceList.col.tipo': 'Tipo',
  'tagList.col.elementos': 'Elementos',

  // --- Menú "+ Añadir recurso" ---
  'resourceList.addMenu.file': 'Subir fichero',
  'resourceList.addMenu.multiple': 'Subir varios ficheros',
  'resourceList.addMenu.folder': 'Subir carpeta',
  'resourceList.addMenu.folderNote': 'Solo se tiene en cuenta el primer nivel de la carpeta',

  // --- Modal de componente: título y pestañas ---
  'componentModal.propsTitle': 'Editar propiedades del componente',
  'componentModal.createTitle': 'Crear componente',
  'componentModal.tab.general': 'Generales',
  'componentModal.tab.visual': 'Apariencia',
  'componentModal.tab.specific': 'Específicas',
  'componentModal.tab.interacciones': 'Interacciones',
  'componentModal.tab.copias': 'Copias',
  'componentModal.borderLegend.extrusion': 'Extrusión',
  'componentModal.designBoardTitle': 'Diseñar tablero personalizado',
  'componentModal.designCardTitle': 'Diseñar carta',
  'componentModal.pasteStyleDisabledTitle': 'Pegar estilo (nada copiado)',

  // --- Zona de revelado de un mazo ---
  'mazo.revealZone.default': 'Carta revelada',

  // --- Nombres de tipo en el identificador de componente ---
  'componentIdentifier.type.texto': 'Texto',
  'componentIdentifier.type.tableroSimple': 'Tablero simple',
  'componentIdentifier.type.dado': 'Dado Configurable',
  'componentIdentifier.type.documento': 'Documento',
  'componentIdentifier.type.carta': 'Carta/Ficha',
  'componentIdentifier.type.mazo': 'Mazo',

  // --- Menú contextual: select de etiqueta ---
  'contextMenu.tagSelect.empty': 'Sin etiquetas',
  'contextMenu.tagSelect.placeholder': 'Elegir etiqueta…',

  // --- Checklist de selección (export/import) ---
  'elementSelection.block.components': 'Componentes',
  'elementSelection.block.resources': 'Recursos',
  'elementSelection.block.tags': 'Etiquetas',

  // --- Informe de importación ---
  'importReport.col.component': 'Componente afectado',
  'importReport.col.error': 'Error',
  'importReport.col.solution': 'Solución',
  'importReport.col.element': 'Elemento erróneo/faltante',
  'importReport.errorType.recurso': 'Recurso no incluido',
  'importReport.errorType.etiqueta': 'Etiqueta no incluida',
  'importReport.errorType.etiquetaDuplicada': 'Nombre de etiqueta duplicado',
  'importReport.solution.tagRenamed': 'Se renombró la etiqueta importada para evitar un nombre duplicado',
  'importReport.solution.componentWithoutResource': 'Se añadió el componente sin ese recurso',
  'importReport.solution.tagLinkedToExisting': 'Se vinculó a una etiqueta ya existente con el mismo nombre en vez de crear una duplicada',
  'importReport.solution.tagAutoCreated': 'Se creó la etiqueta automáticamente',

  // --- Errores de conversión de ficha ---
  'fichaMigration.error.missingDesign': 'Falta la configuración de diseño (properties)',
  'fichaMigration.error.missingShape': 'Falta la forma de la ficha',
  'fichaMigration.error.unknownShape': 'Forma no reconocida',
  'fichaMigration.error.incompleteImageAdjust': 'Ajuste de imagen con datos incompletos',

  // --- Error de lectura de fichero de importación ---
  'persistence.importParseError': 'El fichero no contiene un listado de componentes válido.',

  // --- Editor de recurso Imagen: botones de zoom ---
  'resourceModal.zoom.in': 'Ampliar',
  'resourceModal.zoom.out': 'Reducir',
  'resourceModal.zoom.reset': 'Restablecer vista',

  // --- Modal de reemplazo de recurso duplicado ---
  'resourceReplace.titleSingle': 'Recurso duplicado',
  'resourceReplace.titleMulti': 'Recursos duplicados',

  // --- Modal de etiqueta: título ---
  'tagModal.editTitle': 'Etiqueta: {name}',
  'tagModal.newTitle': 'Nueva etiqueta',

  // --- Editor visual: menú "Añadir elemento", maximizar, cara ---
  'visualEditor.addMenu.bgImage': 'Imagen de fondo…',
  'visualEditor.addMenu.bgColor': 'Color de fondo…',
  'visualEditor.addMenu.textBox': 'Cuadro de texto',
  'visualEditor.addMenu.shape': 'Figura geométrica',
  'visualEditor.maximize': 'Maximizar',
  'visualEditor.restore': 'Restaurar tamaño',
  'visualEditor.faceDefault': 'Diseño',

  // --- Textos de ayuda contextual (icono "?") ---
  'help.lockedField': 'Indica en qué modo(s) este componente no se puede mover. \'Todos los modos\' lo fija también en Modo Edición; \'Solo modo juego\' lo fija únicamente durante la partida (comportamiento por defecto anterior); \'Ninguno\' permite arrastrarlo libremente en ambos.',
  'help.hiddenField': 'Si está marcado, este componente deja de aparecer por completo en Modo Juego (no se ve, no ocupa espacio, no es interactuable). En Modo Edición se sigue mostrando con normalidad, con una insignia que indica que no aparecerá en la partida.',
  'help.raiseOnMove': 'Si está marcado, este componente se coloca automáticamente encima de todos los demás cada vez que se mueve o se interactúa con él (voltear, lanzar) en Modo Juego.',
  'help.showTitle': 'Si está marcado, este componente muestra una etiqueta en su esquina superior izquierda en Modo Juego, con el contenido y colores configurados en "Editar título de componente…".',
  'help.showTooltip': 'Si está marcado, este componente muestra una ayuda al pasar el ratón por encima en Modo Juego: el texto de \'Ayuda\' si tiene contenido, o su identificador si está vacío.',
  'help.playerHelpText': 'Texto que verá el jugador como ayuda. Admite varias líneas, etiquetas HTML básicas: <b>/<strong> (negrita), <i>/<em> (cursiva), <u> (subrayado), <br> (salto de línea), <ul>/<ol>/<li> (listas), y variables como {cards_current} (nº de cartas actual, solo en "Mazo"). Si se deja vacío, se usa el identificador del componente.',
  'help.extrusionNoEffectOnText': 'La extrusión no tiene ningún efecto visual en componentes de tipo \'Texto\', tenga o no tenga color de fondo configurado.',
  'help.rightClickNone': 'Si eliges "Ninguno", el click derecho sobre este componente no hace nada en Modo Juego (no se puede bloquear/desbloquear ni acceder a sus acciones específicas desde ahí). El resto de interacciones no se ven afectadas.',
  'help.desyncOculto': 'Al marcar o desmarcar, todas las copias de este objeto se desincronizan y su \'Oculto\' pasa a este valor de inmediato.',
  'help.copySync': 'Si está marcado, "Bloqueado" y "Oculto" de esta copia siguen siempre el valor del original. Si lo desmarcas, puedes fijar un valor propio para esta copia, independiente del original.',
  'help.group.lockedField': 'Indica en qué modo(s) los miembros de este grupo no se pueden mover, mientras dure la agrupación. \'Todos los modos\' lo fija también en Modo Edición; \'Solo modo juego\' lo fija únicamente durante la partida; \'Ninguno\' permite arrastrarlos libremente en ambos.',
  'help.group.hiddenField': 'Si está marcado, todos los miembros de este grupo dejan de aparecer por completo en Modo Juego mientras dure la agrupación. En Modo Edición se siguen mostrando con normalidad, con una insignia que indica que no aparecerán en la partida.',
  'help.group.showTooltip': 'Si está marcado, los miembros de este grupo muestran su identificador como tooltip al pasar el ratón por encima, pero solo en Modo Juego.',
  'help.group.showTitle': 'Si está marcado, los miembros de este grupo muestran su título de componente (configurado individualmente en cada uno) en Modo Juego.',
  'help.group.raiseOnMove': 'Si está marcado, los miembros de este grupo se colocan automáticamente encima de todos los demás cada vez que se mueven o se interactúa con ellos en Modo Juego.',
  'help.componentTitleText': 'Texto de la etiqueta. Admite varias líneas y etiquetas HTML básicas: <b>/<strong> (negrita), <i>/<em> (cursiva), <u> (subrayado), <br> (salto de línea), <ul>/<ol>/<li> (listas). Admite variables como {cards_current} (nº de cartas actual, solo en "Mazo") — en otros tipos se muestra literal.',
};

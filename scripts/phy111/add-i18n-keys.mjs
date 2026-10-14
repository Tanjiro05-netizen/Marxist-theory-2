#!/usr/bin/env node
// Add the PHY111 interactive-course i18n keys to all six locale files.
// Safe to re-run: only fills missing keys, never overwrites existing ones.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = join(HERE, '..', '..', 'src', 'i18n', 'locales');

// key: [en, es, de, zh, fr, it]
const T = {
  availableModules: ['Available now', 'Disponible ahora', 'Jetzt verfügbar', '现已开放', 'Disponible maintenant', 'Disponibile ora'],
  blockCount: ['{{count}} blocks', '{{count}} bloques', '{{count}} Blöcke', '{{count}} 个内容块', '{{count}} blocs', '{{count}} blocchi'],
  constructedCompare: ['Compare with the model answer', 'Comparar con la respuesta modelo', 'Mit der Musterlösung vergleichen', '与参考答案对照', 'Comparer avec la réponse modèle', 'Confronta con la risposta modello'],
  constructedModelAnswer: ['Model answer', 'Respuesta modelo', 'Musterlösung', '参考答案', 'Réponse modèle', 'Risposta modello'],
  constructedPlaceholder: ['Write your explanation…', 'Escribe tu explicación…', 'Schreibe deine Erklärung…', '写出你的解释…', 'Écrivez votre explication…', 'Scrivi la tua spiegazione…'],
  constructedResponse: ['Written response', 'Respuesta escrita', 'Schriftliche Antwort', '书面回答', 'Réponse rédigée', 'Risposta scritta'],
  constructedRubric: ['Check every point you addressed', 'Marca cada punto que abordaste', 'Markiere jeden abgedeckten Punkt', '勾选你已覆盖的要点', 'Cochez chaque point traité', 'Spunta ogni punto trattato'],
  constructedRubricChecked: ['points confirmed', 'puntos confirmados', 'Punkte bestätigt', '项已确认', 'points confirmés', 'punti confermati'],
  debugDiagnosis: ['Diagnosis', 'Diagnóstico', 'Diagnose', '诊断', 'Diagnostic', 'Diagnosi'],
  debugErrorClass: ['Error class', 'Clase de error', 'Fehlerklasse', '错误类别', "Classe d'erreur", 'Classe di errore'],
  debugFlawedSolution: ['Flawed solution — find the errors', 'Solución defectuosa: encuentra los errores', 'Fehlerhafte Lösung — finde die Fehler', '有缺陷的解答——找出错误', 'Solution erronée — trouvez les erreurs', 'Soluzione errata — trova gli errori'],
  debugPlaceholder: ['Write your diagnosis…', 'Escribe tu diagnóstico…', 'Schreibe deine Diagnose…', '写出你的诊断…', 'Écrivez votre diagnostic…', 'Scrivi la tua diagnosi…'],
  debugSubmitDiagnosis: ['Submit diagnosis', 'Enviar diagnóstico', 'Diagnose absenden', '提交诊断', 'Envoyer le diagnostic', 'Invia la diagnosi'],
  debugTask: ['Debug the solution', 'Depura la solución', 'Löse den Fehler', '调试这道解答', "Déboguer la solution", 'Correggi la soluzione'],
  fbdAdd: ['Add force', 'Añadir fuerza', 'Kraft hinzufügen', '添加力', 'Ajouter une force', 'Aggiungi forza'],
  fbdAngle: ['Direction', 'Dirección', 'Richtung', '方向', 'Direction', 'Direzione'],
  fbdBuilder: ['Free-body diagram', 'Diagrama de cuerpo libre', 'Kräftefreikörperbild', '受力分析图', "Diagramme des forces", 'Diagramma delle forze'],
  fbdCheck: ['Check diagram', 'Comprobar diagrama', 'Diagramm prüfen', '检查图', 'Vérifier le diagramme', 'Verifica il diagramma'],
  fbdCorrect: ['Correct — the diagram matches the expected forces.', 'Correcto: el diagrama coincide con las fuerzas esperadas.', 'Richtig — das Diagramm entspricht den erwarteten Kräften.', '正确——受力图与预期一致。', 'Correct — le diagramme correspond aux forces attendues.', 'Corretto — il diagramma corrisponde alle forze attese.'],
  fbdEmpty: ['No forces added yet.', 'Aún no hay fuerzas.', 'Noch keine Kräfte hinzugefügt.', '尚未添加力。', 'Aucune force ajoutée.', 'Nessuna forza aggiunta.'],
  fbdExtra: ['Remove (not part of the model)', 'Sobra (no forma parte del modelo)', 'Zu viel (nicht Teil des Modells)', '多余（不属于该模型）', 'En trop (hors du modèle)', 'In più (fuori dal modello)'],
  fbdForce: ['Force', 'Fuerza', 'Kraft', '力', 'Force', 'Forza'],
  fbdMissing: ['Missing', 'Falta', 'Fehlt', '缺失', 'Manquant', 'Mancante'],
  fbdWrongDirection: ['Wrong direction', 'Dirección equivocada', 'Falsche Richtung', '方向错误', 'Mauvaise direction', 'Direzione sbagliata'],
  fbdYourForces: ['Your forces', 'Tus fuerzas', 'Deine Kräfte', '你添加的力', 'Vos forces', 'Le tue forze'],
  fbdYours: ['yours', 'tuya', 'deine', '你的', 'le vôtre', 'tuo'],
  graphTableData: ['Data table', 'Tabla de datos', 'Datentabelle', '数据表', 'Tableau de données', 'Tabella dati'],
  graphTableLab: ['Graph and table lab', 'Laboratorio de gráficas y tablas', 'Graph- und Tabellenlabor', '图表实验', 'Atelier graphique et tableau', 'Laboratorio grafico e tabella'],
  graphTableNeedData: ['Enter at least two complete rows to plot.', 'Introduce al menos dos filas completas.', 'Mindestens zwei vollständige Zeilen eingeben.', '至少填入两行完整数据。', 'Saisissez au moins deux lignes complètes.', 'Inserisci almeno due righe complete.'],
  graphTablePlot: ['Plot', 'Gráfica', 'Diagramm', '图像', 'Graphique', 'Grafico'],
  hourCount: ['{{count}} h', '{{count}} h', '{{count}} h', '{{count}} 小时', '{{count}} h', '{{count}} h'],
  lessonCount: ['{{count}} lessons', '{{count}} lecciones', '{{count}} Lektionen', '{{count}} 课', '{{count}} leçons', '{{count}} lezioni'],
  minuteCount: ['{{count}} min', '{{count}} min', '{{count}} Min.', '{{count}} 分钟', '{{count}} min', '{{count}} min'],
  moduleLockedHint: ['Locked until the previous module is complete.', 'Bloqueado hasta completar el módulo anterior.', 'Gesperrt, bis das vorherige Modul abgeschlossen ist.', '完成前一模块后解锁。', "Verrouillé jusqu'à la fin du module précédent.", 'Bloccato finché il modulo precedente non è completato.'],
  motionCalibrateHint: ['Click the two ends of the known length.', 'Haz clic en los dos extremos de la longitud conocida.', 'Klicke auf beide Enden der bekannten Länge.', '点击已知长度的两个端点。', 'Cliquez sur les deux extrémités de la longueur connue.', "Clicca sulle due estremità della lunghezza nota."],
  motionCalibrateLength: ['Calibrate known length', 'Calibrar longitud conocida', 'Bekannte Länge kalibrieren', '标定已知长度', 'Calibrer la longueur connue', 'Calibra la lunghezza nota'],
  motionCalibrating: ['Click the two calibration points…', 'Haz clic en los dos puntos de calibración…', 'Klicke die zwei Kalibrierpunkte…', '点击两个标定点…', 'Cliquez sur les deux points de calibration…', 'Clicca sui due punti di calibrazione…'],
  motionCalibration: ['Scale calibration', 'Calibración de escala', 'Maßstabskalibrierung', '比例标定', 'Calibration de l’échelle', 'Calibrazione della scala'],
  motionClickHint: ['click the video to mark the tracked point', 'haz clic en el vídeo para marcar el punto', 'klicke ins Video, um den Punkt zu markieren', '点击视频标记跟踪点', 'cliquez sur la vidéo pour marquer le point', 'clicca sul video per marcare il punto'],
  motionDatasetDescription: ['Bundled fallback observations', 'Observaciones de respaldo incluidas', 'Mitgelieferte Ersatzbeobachtungen', '内置备用观测数据', 'Observations de secours fournies', 'Osservazioni di riserva incluse'],
  motionDatasetMode: ['Analysing the bundled dataset', 'Analizando el conjunto de datos incluido', 'Mitgelieferten Datensatz auswerten', '正在分析内置数据集', 'Analyse du jeu de données fourni', 'Analisi del dataset incluso'],
  motionHideTable: ['Hide data table', 'Ocultar tabla', 'Datentabelle ausblenden', '收起数据表', 'Masquer le tableau', 'Nascondi la tabella'],
  motionKnownLength: ['Known length', 'Longitud conocida', 'Bekannte Länge', '已知长度', 'Longueur connue', 'Lunghezza nota'],
  motionLab: ['Motion-tracking lab', 'Laboratorio de seguimiento de movimiento', 'Bewegungsanalyse-Labor', '运动跟踪实验', 'Laboratoire de suivi du mouvement', 'Laboratorio di tracciamento del moto'],
  motionLabQuestions: ['Record your results', 'Registra tus resultados', 'Ergebnisse festhalten', '记录你的结果', 'Consignez vos résultats', 'Registra i tuoi risultati'],
  motionMissingSource: ['No video or dataset configured for this lab.', 'Ningún vídeo ni conjunto de datos configurado.', 'Kein Video oder Datensatz konfiguriert.', '该实验未配置视频或数据集。', 'Aucune vidéo ni donnée configurée.', 'Nessun video o dataset configurato.'],
  motionNeedMorePoints: ['aim for at least {{count}} tracked points', 'apunta a al menos {{count}} puntos', 'ziele auf mindestens {{count}} Punkte ab', '建议至少跟踪 {{count}} 个点', 'visez au moins {{count}} points', 'mira ad almeno {{count}} punti'],
  motionNextFrame: ['Next frame', 'Fotograma siguiente', 'Nächstes Bild', '下一帧', 'Image suivante', 'Fotogramma successivo'],
  motionPlay: ['Play', 'Reproducir', 'Abspielen', '播放', 'Lecture', 'Riproduci'],
  motionPoints: ['points', 'puntos', 'Punkte', '个点', 'points', 'punti'],
  motionPositionGraph: ['Position and velocity from your tracking', 'Posición y velocidad de tu seguimiento', 'Position und Geschwindigkeit aus deiner Messung', '由跟踪数据得到的位置与速度', 'Position et vitesse issus de votre suivi', 'Posizione e velocità dal tracciamento'],
  motionPrevFrame: ['Previous frame', 'Fotograma anterior', 'Vorheriges Bild', '上一帧', 'Image précédente', 'Fotogramma precedente'],
  motionPxPerMeter: ['or px/m directly', 'o px/m directamente', 'oder px/m direkt', '或直接填 px/m', 'ou px/m directement', 'o px/m direttamente'],
  motionReset: ['Reset tracking', 'Reiniciar seguimiento', 'Messung zurücksetzen', '重置跟踪', 'Réinitialiser le suivi', 'Azzera tracciamento'],
  motionSaveRecord: ['Check answers and save record', 'Comprobar y guardar registro', 'Prüfen und sichern', '检查答案并保存记录', 'Vérifier et enregistrer', 'Verifica e salva'],
  motionSaved: ['Record saved', 'Registro guardado', 'Gespeichert', '记录已保存', 'Enregistré', 'Registro salvato'],
  motionShowTable: ['Show data table', 'Mostrar tabla', 'Datentabelle anzeigen', '展开数据表', 'Afficher le tableau', 'Mostra la tabella'],
  reviewAgain: ['Again', 'Otra vez', 'Nochmal', '再来', 'Encore', 'Ancora'],
  reviewAllCaughtUp: ['No reviews due right now.', 'No hay repasos pendientes.', 'Keine Wiederholungen fällig.', '当前没有到期的复习。', 'Aucune révision due.', 'Nessuna ripasso in scadenza.'],
  reviewBox: ['Box · next in {{days}} days', 'Caja · próximo en {{days}} días', 'Box · nächste in {{days}} Tagen', '记忆盒 · {{days}} 天后再见', 'Boîte · dans {{days}} jours', 'Casella · tra {{days}} giorni'],
  reviewCheck: ['Check answer', 'Comprobar respuesta', 'Antwort prüfen', '检查答案', 'Vérifier la réponse', 'Verifica la risposta'],
  reviewComeBack: ['{{count}} reviews are scheduled for later.', '{{count}} repasos programados más adelante.', '{{count}} Wiederholungen für später geplant.', '另有 {{count}} 项复习已排期。', '{{count}} révisions prévues plus tard.', '{{count}} ripassi programmati in seguito.'],
  reviewGood: ['Good', 'Bien', 'Gut', '良好', 'Correct', 'Bene'],
  reviewHard: ['Hard', 'Difícil', 'Schwer', '较难', 'Difficile', 'Difficile'],
  reviewHowWell: ['How well did you recall it?', '¿Qué bien lo recordabas?', 'Wie gut war deine Erinnerung?', '你回忆得如何？', 'Avez-vous bien mémorisé ?', 'Quanto bene lo ricordavi?'],
  reviewLoadError: ['Could not load your review cards.', 'No se pudieron cargar tus tarjetas.', 'Wiederholungskarten konnten nicht geladen werden.', '无法加载复习卡片。', 'Impossible de charger vos cartes.', 'Impossibile caricare le carte.'],
  reviewLoading: ['Loading your review queue…', 'Cargando tu cola de repaso…', 'Wiederholungsschlange wird geladen…', '正在加载复习队列…', 'Chargement de votre file de révision…', 'Caricamento della coda di ripasso…'],
  reviewNotQuite: ['Not quite — the answer was:', 'No exactamente; la respuesta era:', 'Nicht ganz — die Antwort war:', '不完全对，答案是：', 'Pas tout à fait — la réponse était :', 'Non proprio — la risposta era:'],
  reviewProgress: ['Card {{current}} of {{total}}', 'Tarjeta {{current}} de {{total}}', 'Karte {{current}} von {{total}}', '第 {{current}} / {{total}} 张', 'Carte {{current}} sur {{total}}', 'Carta {{current}} di {{total}}'],
  reviewRateError: ['Could not save your rating.', 'No se pudo guardar tu valoración.', 'Bewertung konnte nicht gespeichert werden.', '无法保存评分。', "Impossible d'enregistrer votre note.", 'Impossibile salvare la valutazione.'],
  reviewSubtitle: ['Questions you missed come back after 1, 3, 7, and 21 days — rate your recall to reschedule.', 'Las preguntas falladas vuelven a los 1, 3, 7 y 21 días; valora tu recuerdo para reprogramarlas.', 'Verfehlste Fragen kehren nach 1, 3, 7 und 21 Tagen zurück.', '做错的题目会在 1、3、7、21 天后重现——为你的记忆评分以重新排期。', 'Les questions manquées reviennent après 1, 3, 7 et 21 jours.', 'Le domande sbagliate tornano dopo 1, 3, 7 e 21 giorni.'],
  reviewTitle: ['Review your mistakes', 'Repasa tus errores', 'Fehler wiederholen', '复习错题', 'Révisez vos erreurs', 'Ripassa i tuoi errori'],
  reviewUpcoming: ['Coming up', 'Próximamente', 'Demnächst fällig', '即将到期', 'À venir', 'In arrivo'],
  simLab: ['Computational lab', 'Laboratorio computacional', 'Rechenlabor', '计算实验', 'Atelier de calcul', 'Laboratorio computazionale'],
  simLabAnalytic: ['Analytic', 'Analítica', 'Analytisch', '解析解', 'Analytique', 'Analitico'],
  simLabAnalyticDrift: ['Largest Euler–analytic gap:', 'Mayor desviación Euler–analítica:', 'Größte Euler–analytische Abweichung:', '欧拉法与解析解最大偏差：', 'Écart maximal Euler–analytique :', 'Massimo scarto Eulero–analitico:'],
  simLabFinal: ['Final:', 'Final:', 'Endergebnis:', '最终：', 'Final :', 'Finale:'],
  simLabHalfDt: ['Compare with Δt/2', 'Comparar con Δt/2', 'Mit Δt/2 vergleichen', '与 Δt/2 对比', 'Comparer avec Δt/2', 'Confronta con Δt/2'],
  simLabHalfDtDrift: ['Largest gap after halving Δt:', 'Mayor desviación al reducir Δt:', 'Größte Abweichung nach Δt-Halbierung:', '减半 Δt 后最大偏差：', 'Écart maximal après Δt/2 :', 'Massimo scarto dimezzando Δt:'],
  simLabNotRunYet: ['Set your parameters, write your prediction, then run the model.', 'Ajusta los parámetros, escribe tu predicción y ejecuta el modelo.', 'Parameter setzen, Vorhersage schreiben, dann starten.', '设置参数、写下预测，然后运行模型。', 'Réglez les paramètres, écrivez votre prédiction, puis lancez.', 'Imposta i parametri, scrivi la previsione, poi esegui.'],
  simLabParameters: ['Parameters', 'Parámetros', 'Parameter', '参数', 'Paramètres', 'Parametri'],
  simLabPredictFirst: ['Predict before you run', 'Predice antes de ejecutar', 'Vorherzusagen vor dem Start', '先预测，再运行', 'Prédisez avant de lancer', 'Prima prevedi, poi esegui'],
  simLabPredictionPlaceholder: ['What will happen, and why?', '¿Qué ocurrirá y por qué?', 'Was passiert, und warum?', '会发生什么？为什么？', 'Que va-t-il se passer, et pourquoi ?', 'Cosa succederà, e perché?'],
  simLabPredictionRequired: ['Write your prediction to unlock the run.', 'Escribe tu predicción para desbloquear la ejecución.', 'Vorhersage schreiben, um zu starten.', '写下预测后才能运行。', 'Écrivez votre prédiction pour lancer.', "Scrivi la previsione per eseguire."],
  simLabRerun: ['Run again', 'Ejecutar de nuevo', 'Erneut starten', '重新运行', 'Relancer', 'Esegui di nuovo'],
  simLabResults: ['Results', 'Resultados', 'Ergebnisse', '结果', 'Résultats', 'Risultati'],
  simLabRun: ['Run model', 'Ejecutar modelo', 'Modell starten', '运行模型', 'Lancer le modèle', 'Esegui il modello'],
  simLabUnknownModel: ['Unknown lab model: {{kind}}', 'Modelo desconocido: {{kind}}', 'Unbekanntes Modell: {{kind}}', '未知实验模型：{{kind}}', 'Modèle inconnu : {{kind}}', 'Modello sconosciuto: {{kind}}'],
  simLabValidation: ['Validation checklist', 'Lista de validación', 'Validierungs-Checkliste', '验证清单', 'Liste de validation', 'Checklist di validazione'],
  simRevealSimulation: ['Reveal simulation', 'Mostrar simulación', 'Simulation anzeigen', '显示模拟', 'Afficher la simulation', 'Mostra la simulazione'],
  studioAttemptFirst: ['Your attempt first', 'Primero tu intento', 'Zuerst dein Lösungsversuch', '先自己尝试', "D'abord votre essai", 'Prima il tuo tentativo'],
  studioAttemptPlaceholder: ['Set up the problem, choose your approach, and carry it as far as you can…', 'Plantea el problema, elige tu enfoque y llévalo tan lejos como puedas…', 'Ansatz wählen und so weit wie möglich rechnen…', '分析问题、选择方法，尽量做下去…', 'Posez le problème, choisissez votre méthode, allez aussi loin que possible…', 'Imposta il problema, scegli il metodo e procedi fin dove puoi…'],
  studioChars: ['characters', 'caracteres', 'Zeichen', '字符', 'caractères', 'caratteri'],
  studioHideSolution: ['Hide solution', 'Ocultar solución', 'Lösung ausblenden', '收起解答', 'Masquer la solution', 'Nascondi la soluzione'],
  studioInterpretation: ['Interpretation', 'Interpretación', 'Interpretation', '解释', 'Interprétation', 'Interpretazione'],
  studioMinChars: ['Write at least {{count}} characters before revealing.', 'Escribe al menos {{count}} caracteres antes de revelar.', 'Schreibe mindestens {{count}} Zeichen.', '写出至少 {{count}} 个字符后再查看解答。', 'Écrivez au moins {{count}} caractères.', 'Scrivi almeno {{count}} caratteri.'],
  studioModelSolution: ['Model solution', 'Solución modelo', 'Musterlösung', '参考解答', 'Solution modèle', 'Soluzione modello'],
  studioRevealSolution: ['Reveal the solution', 'Revelar la solución', 'Lösung anzeigen', '查看解答', 'Révéler la solution', 'Mostra la soluzione'],
  studioSaving: ['Saving…', 'Guardando…', 'Speichern…', '保存中…', 'Enregistrement…', 'Salvataggio…'],
  studioYourAttempt: ['Your attempt', 'Tu intento', 'Dein Versuch', '你的尝试', 'Votre essai', 'Il tuo tentativo'],
  suggestedPace: ['Suggested pace', 'Ritmo sugerido', 'Empfohlenes Tempo', '建议节奏', 'Rythme suggéré', 'Ritmo suggerito'],
  tasksChecked: ['{{completed}}/{{total}} tasks', '{{completed}}/{{total}} tareas', '{{completed}}/{{total}} Aufgaben', '{{completed}}/{{total}} 项任务', '{{completed}}/{{total}} tâches', '{{completed}}/{{total}} attività'],
  videoTranscriptOnly: ['Briefing transcript', 'Transcripción de la instrucción', 'Anweisungsprotokoll', '实验说明文稿', 'Transcript de la consigne', 'Trascrizione della breve lezione'],
  workedExampleStudio: ['Worked-example studio', 'Estudio de ejemplo resuelto', 'Beispiel-Studio', '例题工作坊', "Atelier d'exemple", 'Studio di esempio'],
  interactiveWidget: ['Interactive widget', 'Widget interactivo', 'Interaktives Widget', '交互小部件', 'Widget interactif', 'Widget interattivo'],
  simLabType: ['Parameter lab', 'Laboratorio de parámetros', 'Parameterlabor', '参数实验', 'Atelier de paramètres', 'Laboratorio di parametri'],
  motionLabType: ['Motion lab', 'Laboratorio de movimiento', 'Bewegungslabor', '运动实验', 'Atelier de mouvement', 'Laboratorio di moto'],
  graphTableLabType: ['Graph & table lab', 'Laboratorio de gráficas', 'Graph- & Tabellenlabor', '图表实验', 'Atelier graphique', 'Laboratorio grafici'],
  fbdBuilderType: ['FBD builder', 'Constructor de diagramas', 'Kräftebild-Baukasten', '受力图构建', 'Constructeur de diagrammes', 'Costruttore di diagrammi'],
  debugTaskType: ['Debug task', 'Tarea de depuración', 'Fehleranalyse', '纠错任务', 'Exercice de débogage', 'Compito di debug'],
  constructedResponseType: ['Written response', 'Respuesta escrita', 'Schriftliche Antwort', '书面回答', 'Réponse rédigée', 'Risposta scritta'],
  exampleStudio: ['Example studio', 'Estudio de ejemplos', 'Beispiel-Studio', '例题工作坊', "Atelier d'exemples", 'Studio di esempi'],
};

const LOCALES = ['en', 'es', 'de', 'zh', 'fr', 'it'];

for (const locale of LOCALES) {
  const path = join(LOCALES_DIR, `${locale}.json`);
  const data = JSON.parse(readFileSync(path, 'utf8'));
  data.science = data.science || {};
  let added = 0;
  for (const [key, values] of Object.entries(T)) {
    if (data.science[key] === undefined) {
      data.science[key] = values[LOCALES.indexOf(locale)];
      added += 1;
    }
  }
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  console.log(`${locale}: added ${added} keys`);
}

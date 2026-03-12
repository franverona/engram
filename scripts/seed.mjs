#!/usr/bin/env zx
import Database from 'better-sqlite3'
import * as sqliteVec from 'sqlite-vec'

const DB_PATH = process.env.DATABASE_PATH ?? './data/engram.db'
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
const EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL ?? 'nomic-embed-text'

// ---------------------------------------------------------------------------
// DB setup
// ---------------------------------------------------------------------------

const sqlite = new Database(DB_PATH)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')
sqliteVec.load(sqlite)

sqlite.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS note_embeddings USING vec0(
    note_id INTEGER PRIMARY KEY,
    embedding float[768]
  )
`)
sqlite.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS note_fts USING fts5(title, body)
`)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getEmbedding(text) {
  let res
  try {
    res = await fetch(`${OLLAMA_BASE_URL}/v1/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
    })
  } catch {
    console.error(chalk.red('\nNo se pudo conectar a Ollama. Asegúrate de que esté corriendo.'))
    process.exit(1)
  }

  if (!res.ok) {
    const body = await res.text()
    console.error(chalk.red(`\nOllama respondió con error ${res.status}: ${body}`))
    process.exit(1)
  }

  const data = await res.json()
  return new Float32Array(data.data[0].embedding)
}

function insertNote(title, body, tagNames = []) {
  const note = sqlite
    .prepare('INSERT INTO notes (title, body) VALUES (?, ?) RETURNING id')
    .get(title, body)

  for (const name of tagNames) {
    sqlite.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)').run(name)
    const tag = sqlite.prepare('SELECT id FROM tags WHERE name = ?').get(name)
    sqlite.prepare('INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)').run(note.id, tag.id)
  }

  sqlite.prepare('DELETE FROM note_fts WHERE rowid = ?').run(note.id)
  sqlite
    .prepare('INSERT INTO note_fts (rowid, title, body) VALUES (?, ?, ?)')
    .run(note.id, title, body)

  return note.id
}

function insertEmbedding(noteId, embedding) {
  const buf = Buffer.from(embedding.buffer, embedding.byteOffset, embedding.byteLength)
  sqlite.prepare('DELETE FROM note_embeddings WHERE note_id = ?').run(BigInt(noteId))
  sqlite
    .prepare('INSERT INTO note_embeddings (note_id, embedding) VALUES (?, ?)')
    .run(BigInt(noteId), buf)
}

// ---------------------------------------------------------------------------
// Recipe data (50 recetas en español)
// ---------------------------------------------------------------------------

const recipes = [
  {
    title: 'Gazpacho andaluz',
    tags: ['sopa', 'vegano', 'verano', 'España'],
    body: `Ingredientes:
- 1 kg de tomates maduros
- 1 pepino mediano
- 1 pimiento verde
- 1 diente de ajo
- 50 ml de aceite de oliva virgen extra
- 2 cucharadas de vinagre de jerez
- Sal al gusto
- 200 ml de agua fría

Preparación:
1. Lavar y trocear todos los vegetales.
2. Triturar todo junto con el ajo, aceite, vinagre y agua en una batidora potente hasta obtener una crema homogénea.
3. Colar con un colador fino para eliminar pieles y semillas.
4. Rectificar de sal y vinagre.
5. Refrigerar al menos 2 horas antes de servir.
6. Servir bien frío, acompañado de daditos de pepino, tomate y pimiento por encima.`,
  },
  {
    title: 'Paella valenciana',
    tags: ['arroz', 'pollo', 'tradicional', 'España'],
    body: `Ingredientes (4 personas):
- 400 g de arroz bomba
- 1 pollo troceado
- 200 g de judías verdes planas
- 150 g de garrofó (o judía blanca)
- 1 tomate maduro rallado
- Aceite de oliva
- Pimentón dulce
- Azafrán
- Sal
- 1 litro de caldo de pollo caliente

Preparación:
1. Calentar aceite en la paellera y dorar el pollo a fuego medio-alto.
2. Añadir las judías verdes y el garrofó, rehogar unos minutos.
3. Incorporar el tomate rallado y el pimentón, sofreír 2 minutos sin que el pimentón se queme.
4. Verter el caldo caliente y el azafrán. Rectificar de sal.
5. Cuando hierva, añadir el arroz repartiéndolo uniformemente.
6. Cocer a fuego alto 10 minutos, luego bajar y cocer 8 minutos más.
7. Dejar reposar 5 minutos cubierto con papel de periódico antes de servir.`,
  },
  {
    title: 'Tortilla española',
    tags: ['huevos', 'tapas', 'tradicional', 'España'],
    body: `Ingredientes:
- 6 huevos
- 500 g de patatas
- 1 cebolla mediana (opcional)
- 150 ml de aceite de oliva
- Sal al gusto

Preparación:
1. Pelar y cortar las patatas en láminas finas. Pochar en aceite abundante a fuego medio junto con la cebolla en juliana y sal.
2. Cuando estén tiernas, escurrir bien el aceite y reservar.
3. Batir los huevos con una pizca de sal en un bol grande.
4. Mezclar las patatas con el huevo batido y dejar reposar 5 minutos.
5. En una sartén con un hilo de aceite, verter la mezcla a fuego medio-alto.
6. Cuando los bordes cuajen, dar la vuelta con un plato y cocinar el otro lado 2-3 minutos.
7. Dejar reposar antes de servir. Se puede tomar caliente, templada o fría.`,
  },
  {
    title: 'Cocido madrileño',
    tags: ['legumbres', 'carne', 'invierno', 'España'],
    body: `Ingredientes:
- 300 g de garbanzos (remojados la noche anterior)
- 300 g de carne de vacuno (morcillo)
- 150 g de tocino
- 1 hueso de jamón
- 2 chorizos
- 2 morcillas
- 2 zanahorias
- 2 patatas
- 1/4 de repollo
- Fideos o arroz para la sopa
- Sal

Preparación:
1. En una olla grande, poner los garbanzos con el morcillo, tocino y hueso de jamón. Cubrir con agua fría abundante.
2. Llevar a ebullición, espumar y cocinar a fuego lento 1.5 horas.
3. Añadir chorizos, morcillas, zanahorias y patatas. Seguir cocinando 30 minutos.
4. En otra olla, cocer el repollo aparte.
5. Colar el caldo y cocer los fideos en él para hacer la sopa (primer plato).
6. Servir como segundo plato los garbanzos y la verdura, y como tercero las carnes.`,
  },
  {
    title: 'Fabada asturiana',
    tags: ['legumbres', 'embutido', 'invierno', 'España'],
    body: `Ingredientes:
- 500 g de fabes (alubias blancas asturianas)
- 200 g de lacón
- 2 chorizos asturianos
- 2 morcillas asturianas
- 100 g de tocino
- 1 hueso de jamón
- Azafrán, sal

Preparación:
1. Remojar las fabes la noche anterior en agua fría.
2. Escurrir y poner en una cazuela grande con el lacón, tocino y hueso de jamón. Cubrir de agua fría.
3. Llevar a ebullición, espumar y añadir chorizo y morcilla.
4. Cocer a fuego muy lento (que "sonría") durante 2-3 horas, añadiendo el azafrán y ajustando de sal.
5. "Asustar" la fabada añadiendo un chorrito de agua fría un par de veces durante la cocción para que la piel no se rompa.
6. Servir en cazuela de barro bien caliente.`,
  },
  {
    title: 'Croquetas de jamón ibérico',
    tags: ['tapas', 'jamón', 'España'],
    body: `Ingredientes (20 croquetas):
- 150 g de jamón ibérico picado fino
- 60 g de mantequilla
- 100 g de harina
- 700 ml de leche entera caliente
- Nuez moscada, sal, pimienta
- Huevo, pan rallado y aceite para freír

Preparación:
1. Derretir la mantequilla en una sartén a fuego medio. Añadir el jamón y rehogar 1 minuto.
2. Incorporar la harina y remover bien 2 minutos para tostarla sin que se queme.
3. Verter la leche caliente poco a poco, sin dejar de remover con varillas, hasta obtener una bechamel densa y sin grumos.
4. Salpimentar y añadir nuez moscada. Cocinar 5 minutos más removiendo.
5. Volcar en una fuente, cubrir con film a piel y refrigerar mínimo 4 horas.
6. Formar las croquetas, pasarlas por huevo batido y pan rallado.
7. Freír en aceite abundante a 180°C hasta dorar. Escurrir sobre papel absorbente.`,
  },
  {
    title: 'Salmorejo cordobés',
    tags: ['sopa', 'vegano', 'verano', 'España'],
    body: `Ingredientes:
- 1 kg de tomates maduros
- 200 g de pan de telera o miga de pan del día anterior
- 100 ml de aceite de oliva virgen extra
- 1 diente de ajo
- 1 cucharadita de sal
- Huevo duro y jamón serrano para acompañar

Preparación:
1. Triturar los tomates con el ajo en una batidora hasta obtener un puré fino. Colar para eliminar pieles.
2. Remojar el pan en la mezcla de tomate durante 10 minutos.
3. Triturar de nuevo añadiendo el aceite en hilo hasta emulsionar. Debe quedar cremoso y denso.
4. Ajustar de sal.
5. Refrigerar bien frío.
6. Servir con huevo duro picado y jamón serrano en tiras por encima, y un hilo de aceite de oliva.`,
  },
  {
    title: 'Pisto manchego',
    tags: ['verduras', 'vegano', 'España'],
    body: `Ingredientes:
- 2 calabacines
- 2 pimientos verdes
- 1 pimiento rojo
- 2 tomates maduros
- 1 cebolla
- 3 dientes de ajo
- Aceite de oliva, sal, azúcar

Preparación:
1. Cortar todas las verduras en dados pequeños por separado.
2. En una sartén con aceite, pochar la cebolla y el ajo a fuego lento hasta que estén transparentes.
3. Añadir los pimientos y cocinar 10 minutos.
4. Incorporar el calabacín y cocinar 10 minutos más.
5. Añadir el tomate picado (o rallado), una pizca de azúcar para compensar la acidez, y salpimentar.
6. Cocinar a fuego lento 20-25 minutos hasta que todo esté bien cocinado y el líquido se haya evaporado.
7. Servir como guarnición, con huevos fritos por encima o como base para otros platos.`,
  },
  {
    title: 'Pulpo a la gallega',
    tags: ['mariscos', 'tapas', 'España', 'Galicia'],
    body: `Ingredientes:
- 1 pulpo de 1.5 kg (preferiblemente congelado)
- 3 patatas medianas
- Pimentón dulce y picante
- Aceite de oliva virgen extra
- Sal gruesa

Preparación:
1. Cocer el pulpo en agua hirviendo sin sal. "Asustarlo" sumergiéndolo 3 veces antes de dejarlo dentro.
2. Cocer 45-50 minutos a fuego medio hasta que esté tierno (comprobar con un palillo).
3. Apagar y dejar reposar 10 minutos en el agua.
4. Cocer las patatas en el mismo agua del pulpo o aparte, peladas y en rodajas gruesas.
5. Cortar el pulpo con tijeras en rodajas de 1 cm.
6. Servir sobre una tabla de madera con las patatas de base, el pulpo encima, sal gruesa, pimentón dulce y picante, y abundante aceite de oliva.`,
  },
  {
    title: 'Pan con tomate (Pa amb tomàquet)',
    tags: ['tapas', 'vegetariano', 'España', 'Cataluña'],
    body: `Ingredientes:
- Pan de payés o baguette
- 2 tomates maduros
- Aceite de oliva virgen extra
- Sal
- Ajo (opcional)
- Jamón ibérico para acompañar (opcional)

Preparación:
1. Cortar el pan en rebanadas y tostar en el horno o en una plancha hasta que quede crujiente.
2. Opcionalmente, frotar el pan con medio diente de ajo.
3. Cortar los tomates por la mitad y frotar con fuerza la pulpa sobre el pan tostado hasta que quede bien impregnado.
4. Añadir un chorro generoso de aceite de oliva virgen extra y sal al gusto.
5. Servir solo o con jamón ibérico, anchoas, queso o embutido por encima.`,
  },
  {
    title: 'Tacos al pastor',
    tags: ['tacos', 'cerdo', 'México'],
    body: `Ingredientes (para la carne):
- 1 kg de carne de cerdo (lomo o pierna) en láminas finas
- 3 chiles guajillo
- 2 chiles ancho
- 1/4 de piña natural
- 1/2 cebolla
- 3 dientes de ajo
- 1 cucharadita de orégano
- Comino, sal, pimienta, vinagre
- Tortillas de maíz, cilantro, cebolla y salsa verde para servir

Preparación:
1. Desvenar y remojar los chiles en agua caliente 15 minutos.
2. Licuar chiles con ajo, cebolla, especias, vinagre y un poco de agua.
3. Marinar la carne en esta mezcla al menos 4 horas (mejor overnight).
4. Cocinar la carne a la plancha o en sartén caliente.
5. Picar la carne y servir en tortillas de maíz calientes.
6. Acompañar con piña asada picada, cilantro, cebolla, salsa verde y limón.`,
  },
  {
    title: 'Guacamole',
    tags: ['aguacate', 'vegano', 'México', 'dip'],
    body: `Ingredientes:
- 3 aguacates maduros
- 1 tomate bola picado sin semillas
- 1/2 cebolla blanca picada finamente
- 1-2 chiles serranos picados (sin semillas para menos picor)
- Jugo de 2 limones
- Cilantro picado al gusto
- Sal

Preparación:
1. Partir los aguacates a la mitad, retirar el hueso y extraer la pulpa.
2. En un molcajete o bol, machacar el aguacate dejando algunos trozos para textura.
3. Añadir el jugo de limón inmediatamente para evitar oxidación.
4. Incorporar la cebolla, tomate, chile y cilantro.
5. Mezclar y sazonar con sal al gusto.
6. Servir de inmediato acompañado de totopos (chips de tortilla). Cubrir con film a piel si se va a guardar.`,
  },
  {
    title: 'Pozole rojo',
    tags: ['sopa', 'maíz', 'México', 'cerdo'],
    body: `Ingredientes:
- 800 g de maíz cacahuazintle cocido (o pozole enlatado)
- 500 g de carne de cerdo (espaldilla o cabeza)
- 4 chiles guajillo
- 2 chiles ancho
- 3 dientes de ajo
- 1/2 cebolla
- Orégano, comino, sal

Para servir: lechuga, cebolla, rábanos, orégano, tostadas, chile piquin, limón

Preparación:
1. Cocer la carne con ajo, cebolla y sal hasta que esté tierna (aprox. 1 hora). Reservar caldo.
2. Remojar los chiles en agua caliente 20 minutos, luego licuar con ajo y caldo.
3. Colar y freír en una olla con un poco de aceite, agregar el resto del caldo.
4. Añadir el maíz y la carne deshebrada. Cocer 20 minutos más.
5. Rectificar sazón.
6. Servir bien caliente con todos los acompañamientos en la mesa para que cada quien personalice su pozole.`,
  },
  {
    title: 'Mole negro oaxaqueño',
    tags: ['mole', 'pollo', 'México', 'Oaxaca'],
    body: `Ingredientes (simplificado):
- 1 pollo en piezas
- 4 chiles mulato
- 3 chiles negro (chilhuacle negro)
- 2 chiles chipotle
- 50 g de chocolate negro (70%)
- 1 tortilla vieja
- 2 tomates asados
- 1 cebolla asada, 4 ajos asados
- Plátano macho frito, ajonjolí tostado
- Caldo de pollo, manteca, sal

Preparación:
1. Tostar y remojar los chiles.
2. Freír la tortilla, el plátano y tostar el ajonjolí.
3. Licuar los chiles con tomate, cebolla, ajo, tortilla y plátano.
4. Freír la pasta en manteca a fuego alto, mover constantemente.
5. Agregar caldo poco a poco hasta conseguir consistencia.
6. Añadir chocolate, rectificar de sal y cocinar 30 minutos.
7. Agregar el pollo previamente cocido y hervir 15 minutos más. Servir con arroz rojo.`,
  },
  {
    title: 'Enchiladas verdes',
    tags: ['enchiladas', 'pollo', 'México'],
    body: `Ingredientes:
- 12 tortillas de maíz
- 500 g de pechuga de pollo cocida y deshebrada
- 500 g de tomate verde (tomatillo)
- 2 chiles serranos
- 1/2 cebolla
- 2 dientes de ajo
- Crema, queso fresco, cebolla para decorar
- Aceite, sal

Preparación:
1. Cocer los tomatillos y chiles en agua con sal. Licuar con cebolla y ajo. Sazonar.
2. Freír la salsa en aceite caliente 5 minutos.
3. Pasar las tortillas por la salsa y rellenar con pollo deshebrado.
4. Doblar o enrollar y acomodar en un platón.
5. Bañar con más salsa verde caliente.
6. Decorar con crema, queso desmoronado y aros de cebolla.`,
  },
  {
    title: 'Cochinita pibil',
    tags: ['cerdo', 'México', 'Yucatán'],
    body: `Ingredientes:
- 1.5 kg de carne de cerdo (pierna o paleta)
- 100 g de pasta de achiote
- Jugo de 3 naranjas agrias (o mitad naranja, mitad limón)
- 4 dientes de ajo
- 1 cucharadita de orégano yucateco
- Comino, pimienta negra, pimienta de Jamaica
- Hojas de plátano
- Cebolla morada encurtida y habanero para acompañar

Preparación:
1. Disolver la pasta de achiote en el jugo de naranja agria.
2. Añadir ajo machacado y especias. Mezclar bien.
3. Marinar la carne en esta mezcla al menos 6 horas.
4. Envolver la carne en hojas de plátano y colocar en un molde.
5. Hornear a 160°C durante 3-4 horas hasta que la carne esté muy tierna y se deshaga.
6. Deshebrlar y servir en tortillas con cebolla morada encurtida y chile habanero.`,
  },
  {
    title: 'Chiles en nogada',
    tags: ['México', 'celebración', 'chile'],
    body: `Ingredientes (6 personas):
- 6 chiles poblanos
- 300 g de carne molida de cerdo y res
- Frutas picadas: durazno, manzana, pera, pasas, almendras
- Especias: canela, clavos, pimienta
- Para la nogada: 200 g de nuez de castilla, 150 g de queso de cabra, crema
- Granada y perejil para decorar

Preparación:
1. Asar los chiles directamente en la flama, sudar en bolsa y pelar. Desvenanar con cuidado.
2. Preparar el picadillo: sofreír la carne con especias y frutas picadas. Sazonar.
3. Rellenar los chiles con el picadillo.
4. Para la nogada: licuar nuez pelada, queso y crema hasta obtener una salsa cremosa. Sazonar con sal.
5. Servir los chiles a temperatura ambiente bañados con la nogada.
6. Decorar con granos de granada y hojitas de perejil (los colores de la bandera mexicana).`,
  },
  {
    title: 'Ceviche peruano clásico',
    tags: ['mariscos', 'Perú', 'limón'],
    body: `Ingredientes:
- 600 g de corvina o lenguado muy fresco en cubos de 2 cm
- Jugo de 12 limones peruanos (o limones pequeños y ácidos)
- 1 ají limo rojo picado finamente
- 1/2 cebolla roja en juliana fina
- Cilantro picado
- Sal, pimienta blanca
- 1 diente de ajo rallado
- Para servir: choclo desgranado, cancha, camote en rodajas

Preparación:
1. Sazonar el pescado con sal, pimienta y ajo. Mezclar.
2. Añadir el ají limo y el jugo de limón. La "leche de tigre" se formará naturalmente.
3. Dejar marinar exactamente 3-5 minutos (el ceviche peruano no se marina mucho tiempo).
4. Añadir la cebolla y el cilantro justo antes de servir.
5. Servir inmediatamente en un plato frío, acompañado de choclo, cancha y camote.`,
  },
  {
    title: 'Lomo saltado',
    tags: ['carne', 'Perú', 'chifa', 'wok'],
    body: `Ingredientes:
- 500 g de lomo fino de res en tiras
- 2 tomates en gajos
- 1 cebolla morada en gajos
- 2 ajíes amarillos en tiras
- 3 cucharadas de sillao (soya)
- 2 cucharadas de vinagre
- Sal, pimienta, comino, orégano
- Aceite vegetal
- Papas fritas y arroz blanco para acompañar
- Cilantro y perejil picados

Preparación:
1. Sazonar la carne con sal, pimienta y comino.
2. En un wok o sartén muy caliente con aceite, saltear la carne a fuego alto 2 minutos. Reservar.
3. En la misma sartén, saltear la cebolla y el ají amarillo 1 minuto.
4. Añadir el tomate, sillao y vinagre. Saltear 1 minuto más.
5. Incorporar la carne y mezclar todo. Añadir el cilantro y perejil.
6. Servir sobre arroz blanco y papas fritas.`,
  },
  {
    title: 'Ají de gallina',
    tags: ['pollo', 'Perú', 'picante'],
    body: `Ingredientes:
- 1 pechuga de pollo cocida y deshilachada
- 5 ajíes amarillos limpios y licuados
- 4 rebanadas de pan de molde (sin corteza) remojadas en leche
- 100 g de nueces molidas
- 50 g de queso parmesano rallado
- 1 cebolla picada, 2 dientes de ajo
- Caldo de pollo, aceite, sal, pimienta
- Aceitunas, huevo duro, papas cocidas para servir

Preparación:
1. Sofreír cebolla y ajo hasta transparentar. Añadir el ají amarillo licuado.
2. Incorporar el pan escurrido y las nueces. Remover bien.
3. Añadir caldo poco a poco hasta obtener una salsa cremosa.
4. Incorporar el pollo deshilachado y el queso. Sazonar.
5. Cocinar a fuego lento 10 minutos.
6. Servir sobre papas cocidas, decorar con aceitunas, huevo duro y un hilo de aceite.`,
  },
  {
    title: 'Causa limeña',
    tags: ['papa', 'Perú', 'frío'],
    body: `Ingredientes:
- 800 g de papa amarilla cocida y pasada por prensa
- Pasta de ají amarillo
- Jugo de limón, aceite
- Sal, pimienta
- Para el relleno: 300 g de atún en lata o pechuga de pollo, mayonesa, aguacate

Preparación:
1. Mezclar la papa prensada con ají amarillo al gusto, jugo de limón, aceite, sal y pimienta.
2. Dividir la masa en tres partes (para tres capas).
3. En un molde o aro, poner una capa de papa, aplastar bien.
4. Añadir el relleno: atún mezclado con mayonesa, o pollo con mayonesa.
5. Colocar rodajas de aguacate y tapar con otra capa de papa.
6. Refrigerar 1 hora. Desmoldar y decorar con mayonesa, aceitunas y perejil.`,
  },
  {
    title: 'Arepas colombianas',
    tags: ['maíz', 'Colombia', 'desayuno', 'vegetariano'],
    body: `Ingredientes (8 arepas):
- 2 tazas de masa de maíz precocida (harina PAN)
- 2 tazas de agua tibia
- 1 cucharadita de sal
- 1 cucharada de mantequilla
- Queso blanco rallado (opcional, al gusto)

Preparación:
1. Mezclar la harina de maíz con agua tibia, sal y mantequilla. Amasar hasta obtener una masa suave y sin grietas.
2. Dejar reposar 5 minutos cubierta con un paño.
3. Dividir en 8 porciones iguales. Formar bolitas y aplanar entre las palmas para obtener discos de 1 cm de grosor.
4. Cocinar en un budare o comal a fuego medio-bajo, sin aceite, 5-7 minutos por lado.
5. Deben quedar doradas por fuera y con un sonido hueco al golpearlas.
6. Abrir con un cuchillo y rellenar con queso, mantequilla, huevos, carne o lo que desees.`,
  },
  {
    title: 'Bandeja paisa',
    tags: ['Colombia', 'frijoles', 'carne', 'tradicional'],
    body: `Ingredientes (para 1 bandeja):
- 200 g de frijoles rojos cocidos con hogao
- 1 trozo de chicharrón crujiente
- 1 chorizo asado
- 1 porción de carne molida sazonada
- 1 huevo frito
- 1 tajada de aguacate
- Arroz blanco
- Patacones o plátano maduro
- Arepa de maíz

Preparación:
1. Cocinar los frijoles con sofrito de tomate y cebolla (hogao), sazonar bien.
2. Preparar el chicharrón: freír la panceta con sal a fuego lento hasta que quede crujiente.
3. Asar el chorizo en plancha o parrilla.
4. Sofreír la carne molida con comino, sal y pimienta.
5. Freír el huevo a su gusto.
6. Disponer todo en una bandeja grande: arroz, frijoles, chicharrón, chorizo, carne, huevo, aguacate, plátano y arepa.`,
  },
  {
    title: 'Sancocho colombiano',
    tags: ['sopa', 'Colombia', 'pollo', 'yuca'],
    body: `Ingredientes:
- 1 pollo en presas o 500 g de carne de res
- 2 mazorcas en trozos
- 200 g de yuca en trozos
- 2 papas
- 1 plátano verde en trozos
- 1 cebolla larga
- 2 dientes de ajo
- Cilantro, comino, color (achiote), sal

Preparación:
1. En una olla grande, poner el pollo con agua, cebolla, ajo, comino y color. Hervir.
2. Espumar y añadir el plátano verde y la yuca. Cocer 20 minutos.
3. Añadir las mazorcas y las papas. Cocinar 20 minutos más.
4. Rectificar el sazón y añadir cilantro fresco picado.
5. Servir bien caliente con arroz blanco, aguacate y ají picante al lado.`,
  },
  {
    title: 'Frijoles negros cubanos',
    tags: ['Cuba', 'legumbres', 'vegetariano'],
    body: `Ingredientes:
- 400 g de frijoles negros (remojados overnight)
- 1 pimiento verde picado
- 1 cebolla picada
- 4 dientes de ajo
- 1 hoja de laurel
- Comino, orégano, sal
- Aceite de oliva
- 2 cucharadas de vinagre
- 1 cucharadita de azúcar

Preparación:
1. Cocer los frijoles en agua fresca con laurel hasta que estén tiernos (1-1.5 horas).
2. Preparar un sofrito: sofreír en aceite la cebolla, el pimiento y el ajo.
3. Añadir comino y orégano al sofrito. Incorporar a los frijoles.
4. Sacar una taza de frijoles, machacarlos y volver a añadir para espesar.
5. Agregar vinagre y azúcar. Rectificar sal.
6. Cocer a fuego lento 15 minutos más. Servir sobre arroz blanco.`,
  },
  {
    title: 'Ropa vieja cubana',
    tags: ['Cuba', 'carne', 'res'],
    body: `Ingredientes:
- 600 g de falda de res
- 1 pimiento rojo y 1 verde en tiras
- 1 cebolla en juliana
- 4 dientes de ajo
- 400 g de tomate triturado
- 1 copa de vino blanco
- Aceite de oliva, sal, comino, orégano, pimienta

Preparación:
1. Cocer la carne en agua con sal, ajo y cebolla hasta que esté muy tierna (1-1.5 horas). Deshebrlar.
2. Reservar el caldo de cocción.
3. Sofreír en aceite la cebolla, los pimientos y el ajo hasta ablandar.
4. Añadir el tomate y el vino. Cocinar 10 minutos.
5. Incorporar la carne deshebrada y un poco de caldo. Sazonar con comino y orégano.
6. Guisar a fuego lento 20 minutos hasta que la salsa espese.
7. Servir con arroz blanco y frijoles negros.`,
  },
  {
    title: 'Mofongo puertorriqueño',
    tags: ['Puerto Rico', 'plátano', 'mariscos'],
    body: `Ingredientes:
- 3 plátanos verdes
- 150 g de chicharrones de cerdo
- 4 dientes de ajo
- Aceite de oliva, sal
- Caldo de pollo o caldo de camarones
- Camarones al ajillo para acompañar (opcional)

Preparación:
1. Pelar los plátanos y cortarlos en rodajas de 2 cm.
2. Freír en aceite a fuego medio hasta dorar. Escurrir.
3. En un pilón (mortero grande), machacar el ajo con sal hasta hacer una pasta.
4. Añadir los tostones y los chicharrones, machacar todo junto mezclando bien con el ajo.
5. Añadir un chorrito de aceite de oliva si queda muy seco.
6. Formar una bola y servir bañado con caldo caliente de pollo o camarones. Acompañar con camarones al ajillo.`,
  },
  {
    title: 'Empanadas argentinas al horno',
    tags: ['Argentina', 'carne', 'horno'],
    body: `Ingredientes (12 empanadas):
Para la masa: 500 g de harina, 100 g de manteca, 1 huevo, agua tibia, sal
Para el relleno: 400 g de carne picada, 2 cebollas, 2 huevos duros, aceitunas, pimentón, comino, ají molido, sal

Preparación:
1. Hacer la masa: mezclar harina con sal, incorporar manteca a temperatura ambiente y el huevo. Agregar agua tibia de a poco hasta obtener una masa suave. Refrigerar 30 minutos.
2. Sofreír la cebolla, añadir la carne y condimentar con pimentón, comino y ají. Dejar enfriar.
3. Añadir al relleno los huevos duros picados y aceitunas.
4. Estirar la masa, cortar círculos de 12 cm.
5. Poner una cucharada de relleno, doblar y repulgar los bordes.
6. Pintar con huevo batido y hornear a 200°C por 20-25 minutos.`,
  },
  {
    title: 'Asado argentino',
    tags: ['Argentina', 'carne', 'parrilla'],
    body: `Ingredientes:
- Costillas de res (asado de tira)
- Chorizo criollo
- Morcilla
- Sal gruesa
- Chimichurri para acompañar

Preparación:
1. Encender el fuego con leña o carbón con suficiente anticipación (mínimo 1 hora).
2. Esperar a que se forme una buena brasa sin llama viva.
3. Limpiar la parrilla y engrasarla.
4. Colocar la carne con el hueso hacia abajo primero, salar con sal gruesa.
5. Cocer a fuego lento y constante, sin prisa. Las costillas necesitan 1.5-2 horas.
6. Dar vuelta una sola vez. Los chorizos y morcilla, unos 15-20 minutos.
7. Servir con chimichurri, pan y ensalada mixta.`,
  },
  {
    title: 'Chimichurri',
    tags: ['Argentina', 'salsa', 'condimento', 'vegano'],
    body: `Ingredientes:
- 1 taza de perejil fresco picado muy fino
- 4 dientes de ajo picados muy finos
- 1 cucharadita de orégano seco
- 1/2 cucharadita de ají molido (o más al gusto)
- 1/2 taza de aceite de oliva
- 3 cucharadas de vinagre de vino
- Sal y pimienta al gusto

Preparación:
1. Picar el perejil y el ajo lo más fino posible (no usar licuadora).
2. Mezclar con el orégano, ají molido, sal y pimienta.
3. Añadir el vinagre y mezclar bien.
4. Incorporar el aceite en hilo revolviendo constantemente.
5. Dejar reposar al menos 1 hora para que los sabores se integren.
6. Se conserva en la heladera hasta 1 semana. Usar sobre carnes asadas, pollo o verduras.`,
  },
  {
    title: 'Dulce de leche casero',
    tags: ['Argentina', 'dulce', 'postre'],
    body: `Ingredientes:
- 1 litro de leche entera
- 300 g de azúcar
- 1 cucharadita de bicarbonato de sodio
- 1 cucharadita de extracto de vainilla

Preparación:
1. En una olla de fondo grueso, mezclar la leche con el azúcar y el bicarbonato.
2. Llevar a fuego medio-alto revolviendo hasta que el azúcar se disuelva.
3. Reducir a fuego bajo y cocinar revolviendo frecuentemente durante 1.5-2 horas.
4. El dulce estará listo cuando tome un color marrón dorado y al pasar la cuchara por el fondo se vea el fondo de la olla por un momento.
5. Añadir la vainilla, mezclar y retirar del fuego.
6. Dejar enfriar antes de usar. Se conserva en frasco de vidrio en la heladera hasta 1 mes.`,
  },
  {
    title: 'Alfajores de maicena',
    tags: ['Argentina', 'galleta', 'postre', 'dulce de leche'],
    body: `Ingredientes (20 alfajores):
- 200 g de fécula de maíz
- 100 g de harina
- 100 g de mantequilla a temperatura ambiente
- 100 g de azúcar glass
- 2 yemas de huevo
- 1 cucharadita de vainilla
- 1 cucharadita de polvo de hornear
- Dulce de leche y coco rallado para rellenar

Preparación:
1. Batir la mantequilla con el azúcar glass hasta obtener una crema.
2. Añadir las yemas y la vainilla. Mezclar.
3. Incorporar la fécula, la harina y el polvo de hornear tamizados. Integrar hasta formar una masa suave.
4. Refrigerar 30 minutos. Estirar y cortar círculos de 4 cm.
5. Hornear a 180°C por 10-12 minutos (no deben dorarse).
6. Dejar enfriar y unir de a dos con dulce de leche. Rebozar el borde con coco rallado.`,
  },
  {
    title: 'Locro argentino',
    tags: ['Argentina', 'legumbres', 'invierno', 'maíz'],
    body: `Ingredientes:
- 250 g de maíz blanco partido
- 250 g de porotos (alubias) blancos
- 300 g de carne de cerdo (costilla, patitas)
- 150 g de chorizo colorado
- 100 g de panceta ahumada
- 2 papas, 1 zapallo (calabaza)
- Cebolla, ajo, pimentón, sal

Preparación:
1. Remojar el maíz y los porotos la noche anterior por separado.
2. Cocinar el maíz en agua durante 1 hora. Añadir los porotos y las carnes.
3. Incorporar el chorizo y la panceta. Cocinar a fuego lento 1 hora más.
4. Añadir papa y zapallo en trozos. Seguir cocinando 30 minutos.
5. Preparar la grasa colorada: freír en grasa o aceite cebolla, ajo, pimentón y ají.
6. Servir el locro en platos hondos, chorear con la grasa colorada y poner cebollita de verdeo picada.`,
  },
  {
    title: 'Milanesa napolitana',
    tags: ['Argentina', 'carne', 'queso'],
    body: `Ingredientes:
- 4 filetes de nalga o peceto muy finos (100 g cada uno)
- 2 huevos batidos
- Pan rallado
- Salsa de tomate
- Queso mozzarella en rodajas
- Jamón cocido (opcional)
- Aceite para freír, sal, pimienta

Preparación:
1. Golpear los filetes con un mazo para aplanarlos bien.
2. Salpimentar y pasar por huevo batido, luego por pan rallado. Presionar para que se adhiera.
3. Freír en aceite abundante y caliente hasta dorar por ambos lados.
4. Escurrir y colocar en una fuente de horno.
5. Cubrir cada milanesa con salsa de tomate, una rodaja de jamón y mozzarella encima.
6. Gratinar en el horno a 220°C hasta que el queso se derrita y dore.
7. Servir con papas fritas.`,
  },
  {
    title: 'Humita en chala',
    tags: ['Argentina', 'maíz', 'vegetariano'],
    body: `Ingredientes:
- 6 choclos (mazorcas de maíz) con sus hojas
- 1 cebolla
- 2 cebollas de verdeo
- Ají rojo morrón
- 1 cucharadita de azúcar
- Sal, pimienta, pimentón dulce
- Queso fresco en trozos (opcional)

Preparación:
1. Desgranar los choclos y moler o procesar la mitad hasta obtener una pasta gruesa.
2. Sofreír la cebolla y el ajo, añadir el pimiento y cocinar. Agregar azúcar, sal, pimienta y pimentón.
3. Mezclar el sofrito con el maíz molido y los granos enteros.
4. Poner 2 cucharadas de la mezcla sobre las hojas de choclo (chalas), cerrar como un paquetito y atar.
5. Cocinar al vapor o en agua hirviendo con sal durante 30-40 minutos.
6. Servir calientes, dejando que cada comensal abra su propia humita.`,
  },
  {
    title: 'Arroz con leche',
    tags: ['postre', 'arroz', 'España', 'latam'],
    body: `Ingredientes:
- 200 g de arroz de grano corto
- 1 litro de leche entera
- 150 g de azúcar
- Piel de 1 limón
- 1 rama de canela
- Canela en polvo para servir

Preparación:
1. Remojar el arroz en agua fría 30 minutos. Escurrir.
2. Cocer el arroz con 500 ml de leche, la canela en rama y la piel de limón a fuego muy lento.
3. Añadir el resto de la leche poco a poco, removiendo constantemente para que no se pegue.
4. Cuando el arroz esté tierno y la mezcla cremosa (unos 40 minutos), añadir el azúcar y remover.
5. Cocer 5 minutos más y retirar la piel de limón y la canela.
6. Volcar en cuencos individuales, dejar enfriar y espolvorear con canela en polvo.`,
  },
  {
    title: 'Flan de huevo casero',
    tags: ['postre', 'huevo', 'España', 'latam'],
    body: `Ingredientes:
- 4 huevos + 2 yemas
- 500 ml de leche entera
- 100 g de azúcar
- 1 cucharadita de extracto de vainilla
- Para el caramelo: 100 g de azúcar y 2 cucharadas de agua

Preparación:
1. Hacer el caramelo: en un cazo, calentar el azúcar con el agua sin remover hasta que tome un color dorado.
2. Verter inmediatamente en el molde (o moldes individuales), inclinando para cubrir el fondo.
3. Batir los huevos con el azúcar sin hacer espuma. Añadir la leche tibia y la vainilla. Colar.
4. Verter en el molde sobre el caramelo.
5. Cocer al baño María en el horno a 170°C durante 45-60 minutos hasta que cuaje.
6. Dejar enfriar a temperatura ambiente y refrigerar mínimo 4 horas. Desmoldar volcando sobre un plato.`,
  },
  {
    title: 'Churros con chocolate',
    tags: ['postre', 'desayuno', 'España', 'frito'],
    body: `Ingredientes para los churros:
- 250 ml de agua
- 200 g de harina
- 1 cucharadita de sal
- 1 cucharadita de azúcar
- Aceite para freír, azúcar para espolvorear

Para el chocolate a la taza:
- 500 ml de leche entera
- 100 g de chocolate negro
- 2 cucharadas de azúcar
- 1 cucharada de maicena

Preparación:
1. Hervir el agua con sal y azúcar. Retirar del fuego, añadir la harina de golpe y remover energicamente hasta que no haya grumos.
2. Poner la masa en una manga pastelera con boquilla estrellada.
3. Freír en aceite abundante a 180°C, formando tiras o espirales. Escurrir y espolvorear con azúcar.
4. Para el chocolate: calentar la leche, disolver la maicena en un poco de leche fría, añadir al resto con el chocolate y el azúcar. Cocer removiendo hasta espesar.
5. Servir los churros recién fritos con el chocolate caliente para mojar.`,
  },
  {
    title: 'Tamales de elote mexicanos',
    tags: ['México', 'maíz', 'desayuno'],
    body: `Ingredientes (15-18 tamales):
- 6 mazorcas de elote tierno
- 100 g de mantequilla
- 100 g de azúcar
- 1/2 cucharadita de sal
- 1 cucharadita de polvo de hornear
- Queso fresco en tiras y rajas de chile poblano para el relleno
- Hojas de maíz (olotes) remojadas en agua

Preparación:
1. Desgranar el elote y moler los granos en la licuadora hasta obtener una pasta.
2. Batir la mantequilla con el azúcar hasta acremar. Añadir la pasta de elote, sal y polvo de hornear.
3. Poner 2 cucharadas de masa en cada hoja de maíz, añadir queso y chile, doblar y doblar.
4. Cocer al vapor con las hojas hacia arriba durante 45-50 minutos.
5. Estarán listos cuando la masa se despegue fácilmente de la hoja.
6. Servir calientes con crema y salsa.`,
  },
  {
    title: 'Sopa de tortilla (sopa azteca)',
    tags: ['México', 'sopa', 'tortilla'],
    body: `Ingredientes:
- 8 tortillas de maíz cortadas en tiras
- 4 tomates asados
- 2 chiles pasilla asados y desvenados
- 1/2 cebolla asada
- 2 dientes de ajo
- 1 litro de caldo de pollo
- Aceite, sal
- Para servir: aguacate, crema, queso Oaxaca o Chihuahua, chile chipotle

Preparación:
1. Freír las tiras de tortilla en aceite hasta que estén crujientes. Escurrir sobre papel absorbente.
2. Licuar los tomates asados con la cebolla, el ajo y los chiles pasilla.
3. Freír la salsa en aceite caliente 5 minutos. Añadir el caldo y sal. Hervir 10 minutos.
4. Al servir, poner las tortillas en el fondo del plato, verter el caldo caliente encima.
5. Acompañar con aguacate en cubos, crema, queso y chile chipotle.`,
  },
  {
    title: 'Arroz con pollo latinoamericano',
    tags: ['arroz', 'pollo', 'latam'],
    body: `Ingredientes:
- 1 pollo en presas
- 2 tazas de arroz de grano largo
- 1 cebolla picada
- 4 dientes de ajo
- 1 pimiento rojo picado
- 2 tomates picados
- 1 cucharadita de comino
- 1/2 cucharadita de achiote o cúrcuma
- 4 tazas de caldo de pollo caliente
- Aceite, sal, pimienta, cilantro

Preparación:
1. Sellar el pollo en aceite hasta dorar. Retirar.
2. En la misma olla, sofreír cebolla, ajo y pimiento.
3. Añadir tomate, comino y achiote. Cocinar 5 minutos.
4. Incorporar el arroz y mezclar bien con el sofrito.
5. Verter el caldo caliente y colocar el pollo encima. Sazonar.
6. Tapar y cocer a fuego bajo 20-25 minutos hasta que el arroz absorba todo el líquido.
7. Dejar reposar 5 minutos y servir decorado con cilantro.`,
  },
  {
    title: 'Suspiro limeño',
    tags: ['Perú', 'postre', 'dulce'],
    body: `Ingredientes:
- 400 ml de leche condensada
- 400 ml de leche evaporada
- 4 yemas de huevo
- Para el merengue: 4 claras, 200 g de azúcar, oporto al gusto
- Canela en polvo

Preparación:
1. Mezclar la leche condensada con la evaporada en una olla. Cocinar a fuego lento removiendo hasta que espese y se vea el fondo (manjar blanco).
2. Retirar del fuego y añadir las yemas de una en una, mezclando rápidamente para que no se cuezan.
3. Verter en copas o vasitos individuales. Dejar enfriar.
4. Preparar el merengue italiano: hervir el azúcar con un poco de agua, verter en hilo sobre las claras batidas a punto de nieve hasta que el merengue esté brillante.
5. Añadir oporto al merengue y mezclar.
6. Cubrir cada copa con merengue y espolvorear con canela.`,
  },
  {
    title: 'Caldo de pollo reconfortante',
    tags: ['sopa', 'pollo', 'saludable', 'latam'],
    body: `Ingredientes:
- 1 pollo entero o 1 kg de presas con hueso
- 3 zanahorias
- 3 ramas de apio
- 1 cebolla
- 4 dientes de ajo
- 1 puerro
- Perejil, tomillo, laurel
- Sal, pimienta en grano

Preparación:
1. Poner el pollo en una olla grande, cubrir con agua fría y llevar a ebullición.
2. Espumar bien durante los primeros 10 minutos.
3. Añadir todas las verduras limpias y enteras, las hierbas y la pimienta en grano.
4. Bajar el fuego y cocinar a fuego lento durante 2 horas.
5. Colar y desgrasar el caldo. Deshuesar el pollo.
6. Servir el caldo caliente con el pollo y verduras, fideos o arroz. Perfecto para días fríos o cuando uno está enfermo.`,
  },
  {
    title: 'Lentejas con chorizo',
    tags: ['legumbres', 'chorizo', 'España', 'invierno'],
    body: `Ingredientes:
- 400 g de lentejas pardinas
- 2 chorizos
- 1 cebolla
- 2 dientes de ajo
- 1 pimiento verde
- 2 zanahorias
- 1 tomate maduro
- Pimentón dulce, laurel, aceite de oliva, sal

Preparación:
1. Lavar las lentejas (no necesitan remojo).
2. En una cazuela, sofreír la cebolla, el ajo y el pimiento picados.
3. Añadir el tomate rallado y el pimentón. Rehogar 2 minutos.
4. Incorporar el chorizo en rodajas y las zanahorias en dados.
5. Añadir las lentejas y cubrir con agua o caldo. Poner el laurel.
6. Cocer a fuego lento 30-40 minutos hasta que las lentejas estén tiernas.
7. Rectificar de sal. Servir calientes.`,
  },
  {
    title: 'Tostones (patacones)',
    tags: ['plátano', 'Colombia', 'Cuba', 'Venezuela', 'frito'],
    body: `Ingredientes:
- 2 plátanos verdes
- Aceite vegetal abundante
- Sal al gusto
- Ajo en polvo (opcional)

Preparación:
1. Pelar los plátanos y cortarlos en rodajas diagonales de 2-3 cm.
2. Freír en aceite caliente a fuego medio hasta que estén dorados (no crujientes), unos 3-4 minutos por lado.
3. Retirar y aplanar cada rodaja con un tostonera, un vaso o simplemente con la palma de la mano entre dos papeles.
4. Volver a freír en aceite muy caliente 2-3 minutos por lado hasta que estén crujientes y dorados.
5. Escurrir, salar de inmediato y opcional espolvorear ajo en polvo.
6. Servir como guarnición o aperitivo con guacamole, hogao o lo que prefieras.`,
  },
  {
    title: 'Horchata mexicana',
    tags: ['bebida', 'México', 'arroz', 'vegano'],
    body: `Ingredientes:
- 200 g de arroz crudo
- 1 litro de agua
- 200 ml de leche (o leche de almendras)
- 100 g de azúcar (o al gusto)
- 1 cucharadita de canela en polvo
- 1 cucharadita de esencia de vainilla
- Hielo

Preparación:
1. Remojar el arroz en 500 ml de agua durante al menos 4 horas o toda la noche.
2. Licuar el arroz con su agua de remojo y la canela hasta obtener una mezcla homogénea.
3. Colar por un colador muy fino o una manta de cielo.
4. Añadir el resto del agua, la leche, el azúcar y la vainilla. Mezclar bien.
5. Refrigerar hasta enfriar bien.
6. Servir sobre hielo y espolvorear canela por encima. Agitar antes de servir, ya que el almidón tiende a asentarse.`,
  },
  {
    title: 'Sopa de lima yucateca',
    tags: ['México', 'Yucatán', 'sopa', 'pollo'],
    body: `Ingredientes:
- 2 pechugas de pollo cocidas y deshebradas
- 1.5 litros de caldo de pollo
- 3 limas (o limones pequeños)
- 1/2 cebolla asada
- 3 dientes de ajo asados
- 1 chile xcatic o chile amarillo asado
- 1 tomate asado
- Tortillas en tiras fritas
- Aguacate, chile habanero, cilantro para servir

Preparación:
1. Licuar el tomate asado, la cebolla, el ajo y el chile con un poco de caldo.
2. Freír esta salsa en aceite caliente, añadir el caldo restante.
3. Agregar el jugo de 2 limas y sazonar con sal.
4. Añadir el pollo deshebrado y hervir 5 minutos.
5. Servir con las tiras de tortilla frita, rodajas de lima, aguacate y cilantro.`,
  },
  {
    title: 'Quesadillas de flor de calabaza',
    tags: ['México', 'vegetariano', 'queso'],
    body: `Ingredientes:
- 8 tortillas de maíz
- 200 g de flor de calabaza limpia (sin tallo ni estambres)
- 200 g de queso Oaxaca o manchego
- 1 chile poblano en rajas
- 1/2 cebolla picada
- 2 dientes de ajo picados
- Aceite, sal

Preparación:
1. Sofreír en aceite la cebolla y el ajo. Añadir las rajas de chile y cocinar 3 minutos.
2. Incorporar las flores de calabaza, sazonar con sal y cocinar 2-3 minutos hasta que se marchiten.
3. Calentar las tortillas en comal o sartén a fuego medio.
4. Poner queso en la mitad de la tortilla, añadir una cucharada del relleno de flor.
5. Doblar y cocinar 1-2 minutos por lado hasta que el queso se derrita.
6. Servir calientes con salsa verde, guacamole y crema.`,
  },
  {
    title: 'Ceviche de camarones',
    tags: ['mariscos', 'México', 'limón'],
    body: `Ingredientes:
- 500 g de camarones limpios, cocidos y picados
- Jugo de 5-6 limones
- 3 tomates bola picados
- 1/2 cebolla morada picada
- 1-2 jalapeños o serranos picados
- Cilantro picado
- 1 aguacate en cubos
- Sal, salsa Clamato o jugo de tomate (opcional)
- Tostadas para servir

Preparación:
1. Mezclar los camarones cocidos con el jugo de limón. Dejar reposar 10 minutos.
2. Añadir tomate, cebolla, chile, cilantro y sal. Mezclar bien.
3. Opcionalmente, añadir un chorrito de Clamato para más sabor.
4. Refrigerar 20 minutos.
5. Añadir el aguacate justo antes de servir.
6. Servir en copas de coctel o sobre tostadas.`,
  },
  {
    title: 'Burritos de frijoles y queso',
    tags: ['México', 'frijoles', 'queso', 'vegetariano'],
    body: `Ingredientes (4 burritos):
- 4 tortillas de harina grandes
- 400 g de frijoles bayos o negros refritos
- 200 g de queso Chihuahua o manchego rallado
- 1 taza de arroz rojo cocido
- Crema, guacamole y salsa para acompañar
- Lechuga y tomate picados

Preparación:
1. Calentar las tortillas en comal o microondas para que sean maleables.
2. Calentar los frijoles refritos y extender una capa generosa sobre cada tortilla.
3. Añadir arroz, queso rallado, lechuga y tomate.
4. Enrollar apretando bien: doblar los lados y luego enrollar desde abajo hacia arriba.
5. Dorar en sartén o comal con un poco de mantequilla hasta que queden dorados y crujientes por fuera.
6. Servir con crema, guacamole y salsa al gusto.`,
  },
  {
    title: 'Tres leches',
    tags: ['postre', 'México', 'latam', 'pastel'],
    body: `Ingredientes:
Para el bizcocho: 5 huevos, 200 g de azúcar, 200 g de harina, 1 cucharadita de polvo de hornear, 50 ml de leche
Para el baño: 400 ml de leche condensada, 400 ml de leche evaporada, 250 ml de crema de leche
Para la cubierta: 300 ml de crema para batir, 3 cucharadas de azúcar glass

Preparación:
1. Batir huevos con azúcar hasta triplicar el volumen. Incorporar harina tamizada con movimientos envolventes. Añadir leche.
2. Hornear en molde rectangular a 180°C durante 25-30 minutos. Dejar enfriar.
3. Mezclar las tres leches y verter sobre el bizcocho pinchado con un tenedor.
4. Refrigerar mínimo 4 horas para que absorba todo el líquido.
5. Batir la crema con azúcar glass hasta obtener picos firmes.
6. Cubrir el pastel y decorar a gusto. Servir muy frío.`,
  },
  {
    title: 'Pollo a la brasa peruano',
    tags: ['Perú', 'pollo', 'parrilla'],
    body: `Ingredientes:
- 1 pollo entero (1.5-2 kg)
Para la marinada: 5 dientes de ajo, 2 cucharadas de sillao (soya), 2 cucharadas de mostaza, 1 cucharadita de comino, pimentón, orégano, sal, pimienta, jugo de limón, cerveza negra

Preparación:
1. Licuar todos los ingredientes de la marinada.
2. Hacer cortes en el pollo y cubrir completamente con la marinada. Meter incluso debajo de la piel de la pechuga.
3. Refrigerar mínimo 8 horas (idealmente 24 horas).
4. Asar en horno a 200°C con una cama de papas y ajíes por 1 hora, rotando a la mitad.
5. El pollo estará listo cuando los jugos salgan claros al pinchar.
6. Servir con papas fritas, ensalada fresca y ají verde (crema de ají amarillo con huacatay).`,
  },
  {
    title: 'Sopa de elote',
    tags: ['México', 'sopa', 'maíz', 'vegetariano'],
    body: `Ingredientes:
- 4 mazorcas de elote (o 500 g de granos)
- 1 cebolla picada
- 2 dientes de ajo
- 1 chile poblano asado, pelado y en rajas
- 500 ml de caldo de verduras o pollo
- 250 ml de crema
- Queso fresco, epazote o cilantro
- Aceite, sal, pimienta

Preparación:
1. Desgranar los elotes. Licuar la mitad de los granos con el caldo.
2. Sofreír cebolla y ajo. Añadir las rajas de chile y los granos enteros.
3. Incorporar la mezcla licuada de elote y el caldo restante. Hervir 10 minutos.
4. Añadir la crema, sazonar con sal y pimienta.
5. Cocinar a fuego bajo 5 minutos más sin dejar hervir.
6. Servir con queso fresco desmoronado y hojas de epazote o cilantro.`,
  },
  {
    title: 'Chipa paraguaya',
    tags: ['Paraguay', 'pan', 'queso', 'desayuno'],
    body: `Ingredientes (20 chipas):
- 500 g de almidón de mandioca (yuca)
- 200 g de queso Paraguay o queso fresco
- 3 huevos
- 100 g de mantequilla o manteca
- 1/2 taza de leche
- 1 cucharadita de sal
- 1 cucharadita de anís (opcional)

Preparación:
1. Amasar el almidón con la mantequilla hasta obtener una mezcla arenosa.
2. Añadir el queso rallado, los huevos, la sal y el anís.
3. Agregar la leche poco a poco hasta obtener una masa suave y no pegajosa.
4. Formar roscas, bastones o bolitas según preferencia.
5. Hornear a 200°C durante 15-20 minutos hasta que estén dorados y huecos.
6. Comer recién salidos del horno, son perfectos para el desayuno con café.`,
  },
  {
    title: 'Tamales venezolanos (hallacas)',
    tags: ['Venezuela', 'maíz', 'Navidad', 'carne'],
    body: `Ingredientes (simplificado para 12 hallacas):
Masa: 500 g de harina de maíz, caldo con achiote, manteca
Guiso: 400 g de carne de res y cerdo, pollo; sofrito con pimientos, cebolla, ajo, tomate, aceitunas, alcaparras, pasas, pimentón

Preparación:
1. Preparar el guiso: sofreír la carne con el sofrito y condimentos. Añadir aceitunas, alcaparras y pasas. Refrigerar.
2. Hacer la masa: mezclar la harina con el caldo con achiote y manteca hasta obtener una masa suave y manejable.
3. Extender masa sobre una hoja de plátano engrasada, poner el guiso en el centro.
4. Añadir tiras de pimiento, aceitunas y pasas para decorar.
5. Doblar la hoja formando un paquete rectangular, envolver en otra hoja y atar con pabilo.
6. Cocer en agua hirviendo durante 1 hora. Servir calientes.`,
  },
  {
    title: 'Patacones con hogao',
    tags: ['Colombia', 'plátano', 'vegetariano', 'acompañamiento'],
    body: `Ingredientes:
Para los patacones: 2 plátanos verdes, aceite, sal
Para el hogao: 3 tomates maduros, 2 cebollas largas, ajo, aceite, sal, comino, achiote

Preparación para los patacones:
1. Pelar y cortar los plátanos en rodajas de 3 cm. Freír en aceite caliente hasta dorar.
2. Retirar y aplastar con tostonera o prensa. Volver a freír hasta crujientes. Salar.

Preparación para el hogao:
1. Picar tomates y cebolla larga en cuadritos pequeños.
2. Sofreír en aceite con ajo machacado, comino y achiote.
3. Cocinar a fuego bajo 20-25 minutos, removiendo, hasta que forme una salsa espesa.
4. Sazonar con sal.

Servir los patacones calientes cubiertos con el hogao. Opcional: añadir queso rallado o aguacate.`,
  },
  {
    title: 'Caldo tlalpeño',
    tags: ['México', 'sopa', 'pollo', 'garbanzos'],
    body: `Ingredientes:
- 2 pechugas de pollo cocidas y deshebradas
- 200 g de garbanzos cocidos
- 2 chiles chipotles (en adobo o secos hidratados)
- 4 jitomates (tomates) asados
- 1/2 cebolla asada
- 3 dientes de ajo asados
- 1.5 litros de caldo de pollo
- Epazote, sal
- Aguacate en cubos y limón para servir

Preparación:
1. Licuar los jitomates asados, cebolla, ajo y chiles chipotles con un poco de caldo.
2. Freír en aceite esta salsa durante 5 minutos.
3. Añadir el caldo y dejar hervir.
4. Incorporar el pollo deshebrado y los garbanzos. Cocer 10 minutos.
5. Añadir unas ramas de epazote fresco y sazonar.
6. Servir con cubos de aguacate, limón y tostadas al lado.`,
  },
  {
    title: 'Tamales de rajas con queso',
    tags: ['México', 'tamales', 'vegetariano', 'chile'],
    body: `Ingredientes (15 tamales):
- 500 g de masa para tamal (masa de maíz nixtamalizada)
- 100 g de manteca vegetal
- 1 taza de caldo de verduras tibio
- 1 cucharadita de sal, 1 cucharadita de polvo de hornear
- Para el relleno: 3 chiles poblanos asados en rajas, 200 g de queso Oaxaca
- Hojas de maíz remojadas

Preparación:
1. Batir la manteca hasta que esté esponjosa. Incorporar la masa poco a poco alternando con el caldo.
2. Añadir sal y polvo de hornear. La masa estará lista si una bolita flota en agua.
3. Extender masa en las hojas, poner rajas de chile y queso en tiras.
4. Cerrar la hoja formando el tamal y doblar la parte inferior hacia arriba.
5. Cocer al vapor durante 1 hora, con el doblez hacia abajo.
6. Dejar reposar 10 minutos antes de abrir. Servir con salsa verde o roja.`,
  },
  {
    title: 'Agua de Jamaica',
    tags: ['bebida', 'México', 'vegano', 'flor de jamaica'],
    body: `Ingredientes:
- 50 g de flor de jamaica seca
- 1.5 litros de agua
- Azúcar al gusto (aprox. 150 g)
- Hielo
- Rodajas de limón para decorar (opcional)

Preparación:
1. Hervir el agua y añadir la flor de jamaica.
2. Apagar el fuego y dejar reposar 15-20 minutos para que infusione bien.
3. Colar y presionar las flores para extraer todo el líquido.
4. Añadir azúcar al gusto mientras aún está caliente para que se disuelva bien.
5. Dejar enfriar a temperatura ambiente y luego refrigerar.
6. Servir bien fría sobre hielo. Opcional: añadir un toque de jugo de limón para más frescura.`,
  },
  {
    title: 'Ensalada de nopales',
    tags: ['México', 'ensalada', 'vegano', 'nopal'],
    body: `Ingredientes:
- 4 nopales medianos limpios y en cubos
- 2 tomates picados
- 1/2 cebolla picada finamente
- 1 chile serrano picado (opcional)
- Cilantro picado al gusto
- Jugo de 2 limones
- Aceite de oliva
- Sal y orégano

Preparación:
1. Cocer los nopales en agua hirviendo con sal, un trozo de cebolla y cilantro durante 10-12 minutos. Escurrir y enjuagar con agua fría para cortar la cocción y eliminar la baba.
2. Dejar escurrir bien sobre un colador.
3. Mezclar los nopales con el tomate, la cebolla y el chile.
4. Añadir el jugo de limón, aceite de oliva, sal y orégano al gusto.
5. Agregar el cilantro picado.
6. Dejar reposar 10 minutos antes de servir para que los sabores se integren. Acompañar con queso fresco desmoronado.`,
  },
]

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log(chalk.bold(`\nEngram seed script — ${recipes.length} recetas\n`))

const insertNoteInTx = sqlite.transaction((title, body, tagNames, buf) => {
  const noteId = insertNote(title, body, tagNames)
  insertEmbedding(noteId, buf) // buf is pre-computed outside the tx (async)
  return noteId
})

// Wrap the per-note embedding upsert in its own mini-tx (as vec.ts does)
// We can't make the embedding call async inside a transaction, so we compute
// the embedding first, then write everything synchronously inside a transaction.
for (let i = 0; i < recipes.length; i++) {
  const recipe = recipes[i]
  process.stdout.write(`[${String(i + 1).padStart(2, '0')}/${recipes.length}] ${recipe.title} … `)

  const text = `${recipe.title}\n${recipe.body}`
  const embedding = await getEmbedding(text)
  const buf = Buffer.from(embedding.buffer, embedding.byteOffset, embedding.byteLength)

  insertNoteInTx(recipe.title, recipe.body, recipe.tags ?? [], buf)

  console.log(chalk.green('✓'))
}

sqlite.close()
console.log(chalk.bold.green(`\nListo. Se insertaron ${recipes.length} recetas.\n`))

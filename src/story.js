// Textos de la historia, encargos y logros
export const INTRO = [
  { title: 'Sierra de Sonora, 2031', text: 'San Isidro fue el pueblo minero más alegre de la sierra. Hoy la fonda está cerrada, la escuela vacía y la campana de la iglesia lleva veinte años muda.' },
  { title: 'El derrumbe', text: 'Hace veinte años, el derrumbe del Tiro Esperanza sepultó las galerías… y a tu abuelo, Don Chuy Valdez, el capataz que nunca salió.' },
  { title: 'La deuda', text: 'La Compañía Minera del Norte le cobra $5,000 al pueblo. Si no se pagan, cerrará la mina para siempre y San Isidro desaparecerá del mapa.' },
  { title: 'La leyenda', text: 'Don Chuy siempre habló del "Corazón de la Sierra": una veta madre de oro y ópalo a más de 200 metros de profundidad. Nadie le creyó.' },
  { title: 'Tu turno', text: 'Tomas su casco, su lámpara y su pico. Junta minerales, paga la deuda, encuentra las 8 bitácoras del abuelo… y llega al Corazón.\n\nConsejo: mantén ↑ dentro de un túnel para poner escaleras. Sin escaleras no hay regreso.' },
];

export const JOURNALS = [
  { d: 12, text: 'Día 1. La Compañía dice que aquí ya no hay nada. Mienten. El cobre brilla en la oscuridad si uno apaga el miedo. Nunca bajes sin escaleras: la mina perdona todo, menos la soberbia.' },
  { d: 34, text: 'Día 9. A los 45 metros encontré granito. Ni el mejor pico lo raja. Hace falta un taladro de verdad; el Güero del pueblo sabe hacerlos.' },
  { d: 58, text: 'Día 23. Las Cuevas de Cristal. Turquesa, del color de los ojos de tu abuela. Ojo con las rocas sueltas: si tiemblan sobre tu cabeza, corre.' },
  { d: 88, text: 'Día 40. El grisú se mueve como si pensara; sigue la luz de la lámpara. Una carga de dinamita lo dispersa… y a ti también, si te quedas cerca.' },
  { d: 112, text: 'Día 57. Aquí abajo hace un calor de infierno. El magma pinta las paredes de rojo. No lo toques, ni te le arrimes. La batería se acaba más rápido.' },
  { d: 145, text: 'Día 61. Oro. Más oro del que vi en treinta años. La Compañía lo sabía desde siempre. Por eso querían cerrar el tiro.' },
  { d: 180, text: 'Día 70. Escucho a la sierra respirar. El derrumbe no fue accidente: alguien voló el Tiro Esperanza para enterrar el secreto conmigo.' },
  { d: 208, text: 'Día 74. Ya lo veo: el Corazón de la Sierra, justo debajo. Si llegas aquí, mijo, el pueblo tiene futuro. Dile a tu abuela que cumplí.' },
];

export const ZONE_LINES = [
  'Las Galerías: cobre y plata cerca de la superficie.',
  'Cuevas de Cristal: turquesa… y rocas sueltas.',
  'El Infierno: oro entre ríos de magma. La batería dura menos.',
  'Corazón de la Sierra: ópalo de fuego. El final está cerca.',
];

export const MILESTONES = [
  { title: '¡La fonda abrió! (25%)', text: 'Doña Lupe volvió a prender el comal. Sus burritos de machaca te dan fuerza: +25 de salud máxima.' },
  { title: '¡La escuela abrió! (50%)', text: 'La profe Inés y sus alumnos dibujaron un mapa geológico de la sierra. Ahora el minimapa marca los minerales cercanos (radar).' },
  { title: '¡Suena la campana! (75%)', text: 'El padre Tomás tocó la campana por primera vez en veinte años. El pueblo, agradecido: 20% de descuento en la tienda.' },
  { title: '¡Deuda pagada! (100%)', text: 'San Isidro ya no le debe nada a la Compañía. Las casas vuelven a encender sus luces.' },
];

export const HEART_TEXT = {
  title: 'El Corazón de la Sierra',
  text: 'Frente a ti brilla una veta de oro y ópalo del tamaño de una casa. A un lado, cubierto de polvo, está el casco amarillo de Don Chuy.\n\nRecuperas un fragmento de la Veta Madre: +$2,500.',
};

export const ENDING = {
  title: '¡SAN ISIDRO VIVE!',
  text: 'Con la deuda pagada y la Veta Madre descubierta, la mina vuelve a ser del pueblo. El casco de Don Chuy cuelga en la fonda de Doña Lupe, junto a una foto suya sonriendo. Cada año, el día del derrumbe, la campana suena veinte veces: una por cada año que el abuelo esperó a que alguien le creyera.',
};

export const NPCS = [
  { name: 'Doña Lupe', reasons: ['reparar el comal de la fonda', 'la boda de su hija', 'comprar gas para la cocina'] },
  { name: 'El Güero', reasons: ['forjar herramientas nuevas', 'arreglar el malacate', 'un taladro de prueba'] },
  { name: 'Profe Inés', reasons: ['la colección de minerales de la escuela', 'una clase de geología', 'la feria de ciencias'] },
  { name: 'Padre Tomás', reasons: ['restaurar la campana', 'el altar de la capilla', 'la kermés del pueblo'] },
  { name: 'Don Beto', reasons: ['su taller de joyería', 'un anillo de compromiso', 'vender artesanías en Hermosillo'] },
];

export const ACHIEVEMENTS = [
  { id: 'primer', name: 'Primer golpe', desc: 'Excava tu primer bloque' },
  { id: 'turquesa', name: 'Turquesa sonorense', desc: 'Encuentra turquesa' },
  { id: 'oro', name: '¡Oro!', desc: 'Encuentra oro' },
  { id: 'opalo', name: 'Ópalo de fuego', desc: 'Encuentra un ópalo de fuego' },
  { id: 'm50', name: '50 metros', desc: 'Baja a 50 m' },
  { id: 'm100', name: '100 metros', desc: 'Baja a 100 m' },
  { id: 'm150', name: '150 metros', desc: 'Baja a 150 m' },
  { id: 'dinamitero', name: 'Dinamitero', desc: 'Haz 10 explosiones' },
  { id: 'cazagrisu', name: 'Cazagrisú', desc: 'Dispersa 5 nubes de grisú' },
  { id: 'vecino', name: 'Buen vecino', desc: 'Cumple 5 encargos' },
  { id: 'historiador', name: 'Historiador', desc: 'Encuentra las 8 bitácoras' },
  { id: 'sobreviviente', name: 'Sobreviviente', desc: 'Cae 8 bloques y sigue vivo' },
  { id: 'corazon', name: 'Corazón de la Sierra', desc: 'Llega a la Veta Madre' },
  { id: 'salvador', name: 'Salvador de San Isidro', desc: 'Paga toda la deuda' },
];

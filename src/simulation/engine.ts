export type WeatherType = 'clear' | 'cloudy' | 'rain' | 'storm' | 'fog';
export type Difficulty = 'relaxed' | 'standard' | 'expert';
export type UnitType = 'police' | 'fire' | 'ems' | 'tow' | 'utility';
export type SignalPhase = 'NS_GREEN' | 'NS_YELLOW' | 'ALL_RED' | 'EW_GREEN' | 'EW_YELLOW';
export type IncidentCategory = 'traffic' | 'fire' | 'medical' | 'infrastructure' | 'event' | 'weather';
export type IncidentStatus = 'new' | 'responding' | 'active' | 'resolved';

export interface Intersection {
  id: string;
  name: string;
  x: number;
  y: number;
  phase: SignalPhase;
  phaseElapsed: number;
  cycleSeconds: number;
}

export interface Road {
  id: string;
  from: string;
  to: string;
  length: number;
  lanes: number;
  speedLimit: number;
  type: 'arterial' | 'collector' | 'local' | 'highway';
  closed: boolean;
  signalId?: string;
}

export interface Vehicle {
  id: string;
  type: 'sedan' | 'suv' | 'truck' | 'bus';
  origin: string;
  destination: string;
  x: number;
  y: number;
  speed: number;
  desiredSpeed: number;
  route: string[];
  currentNode: string;
  targetNode: string;
  state: 'moving' | 'stopped' | 'queued';
  routeIndex: number;
}

export interface Unit {
  id: string;
  type: UnitType;
  x: number;
  y: number;
  status: 'available' | 'dispatched' | 'en_route' | 'on_scene' | 'returning';
  home: string;
  currentNode: string;
  route: string[];
  assignment?: string;
  etaMinutes: number;
}

export interface Camera {
  id: string;
  name: string;
  x: number;
  y: number;
  type: 'fixed' | 'highway' | 'cctv' | 'ptz';
  status: 'online' | 'offline';
  trafficFlow: number;
}

export interface Incident {
  id: string;
  type: string;
  category: IncidentCategory;
  severity: 'minor' | 'moderate' | 'major';
  status: IncidentStatus;
  locationNode: string;
  x: number;
  y: number;
  roadId?: string;
  message: string;
  durationMinutes: number;
}

export interface PowerZone {
  id: string;
  name: string;
  district: string;
  status: 'online' | 'degraded' | 'offline';
}

export interface WaterZone {
  id: string;
  name: string;
  district: string;
  status: 'online' | 'degraded' | 'offline';
}

export interface TransitBus {
  id: string;
  route: string[];
  status: 'running' | 'delayed';
  x: number;
  y: number;
}

export interface GameSettings {
  difficulty: Difficulty;
  seed: string;
}

export interface GameStats {
  totalIncidents: number;
  averageResponse: string;
  trafficDelay: number;
}

export interface GameState {
  seed: string;
  timeOfDayMinutes: number;
  day: number;
  speed: 0 | 1 | 2 | 4 | 8;
  weather: WeatherType;
  alertLevel: 'NORMAL' | 'WATCH' | 'ALERT';
  roads: Road[];
  intersections: Intersection[];
  vehicles: Vehicle[];
  units: Unit[];
  incidents: Incident[];
  cameras: Camera[];
  powerGrid: PowerZone[];
  waterGrid: WaterZone[];
  transit: TransitBus[];
  settings: GameSettings;
  stats: GameStats;
  rng: number;
}

export const DEFAULT_SEED = 'city-ops-seed';

const intersectionMap: Record<string, { id: string; name: string; x: number; y: number }> = {
  north: { id: 'north', name: 'Northside', x: 200, y: 130 },
  downtown: { id: 'downtown', name: 'Downtown', x: 430, y: 220 },
  east: { id: 'east', name: 'East Market', x: 760, y: 180 },
  south: { id: 'south', name: 'South Industrial', x: 330, y: 470 },
  west: { id: 'west', name: 'Westview', x: 120, y: 340 },
  river: { id: 'river', name: 'Riverfront', x: 620, y: 430 },
  hospital: { id: 'hospital', name: 'Mercy Hospital', x: 770, y: 430 },
  stadium: { id: 'stadium', name: 'Civic Stadium', x: 900, y: 300 },
  university: { id: 'university', name: 'Metro University', x: 560, y: 80 },
  park: { id: 'park', name: 'Memorial Park', x: 260, y: 260 },
};

const signalPhases: SignalPhase[] = ['NS_GREEN', 'NS_YELLOW', 'ALL_RED', 'EW_GREEN', 'EW_YELLOW', 'ALL_RED'];

export const weatherModifiers: Record<WeatherType, { speed: number; accidentRate: number; visibility: number }> = {
  clear: { speed: 1.0, accidentRate: 1.0, visibility: 1.0 },
  cloudy: { speed: 0.95, accidentRate: 1.02, visibility: 0.96 },
  rain: { speed: 0.76, accidentRate: 1.25, visibility: 0.78 },
  storm: { speed: 0.64, accidentRate: 1.42, visibility: 0.62 },
  fog: { speed: 0.68, accidentRate: 1.1, visibility: 0.45 },
};

export const incidentsForDifficulty: Record<Difficulty, number> = {
  relaxed: 1,
  standard: 2,
  expert: 3,
};

export function getIntersectionById(state: GameState, id: string) {
  return state.intersections.find((intersection) => intersection.id === id) ?? null;
}

export function getRoadById(state: GameState, id: string) {
  return state.roads.find((road) => road.id === id) ?? null;
}

export function formatClock(minutes: number) {
  const total = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function formatDate(minutes: number) {
  const day = Math.floor(minutes / 1440) + 1;
  return `DAY ${day}`;
}

export function getSignalPhaseText(phase: SignalPhase) {
  return phase;
}

function makeVehicle(state: GameState, id: string, origin: string, destination: string, vehicleType: Vehicle['type']): Vehicle {
  const route = computeRoute(state, origin, destination);
  const startNode = route[0] ?? origin;
  const targetNode = route[1] ?? route[0] ?? origin;
  const startPoint = getIntersectionById(state, startNode) ?? state.intersections[0];

  return {
    id,
    type: vehicleType,
    origin,
    destination,
    x: startPoint.x,
    y: startPoint.y,
    speed: 18,
    desiredSpeed: 32,
    route,
    currentNode: startNode,
    targetNode,
    state: 'moving',
    routeIndex: 0,
  };
}

function makeDefaultIntersections(): Intersection[] {
  return [
    { id: 'north', name: 'Northside', x: 200, y: 130, phase: 'NS_GREEN', phaseElapsed: 0, cycleSeconds: 20 },
    { id: 'downtown', name: 'Downtown', x: 430, y: 220, phase: 'EW_GREEN', phaseElapsed: 0, cycleSeconds: 18 },
    { id: 'east', name: 'East Market', x: 760, y: 180, phase: 'NS_GREEN', phaseElapsed: 0, cycleSeconds: 22 },
    { id: 'south', name: 'South Industrial', x: 330, y: 470, phase: 'EW_GREEN', phaseElapsed: 0, cycleSeconds: 20 },
    { id: 'west', name: 'Westview', x: 120, y: 340, phase: 'NS_GREEN', phaseElapsed: 0, cycleSeconds: 19 },
    { id: 'river', name: 'Riverfront', x: 620, y: 430, phase: 'EW_GREEN', phaseElapsed: 0, cycleSeconds: 21 },
    { id: 'hospital', name: 'Mercy Hospital', x: 770, y: 430, phase: 'NS_GREEN', phaseElapsed: 0, cycleSeconds: 18 },
    { id: 'stadium', name: 'Civic Stadium', x: 900, y: 300, phase: 'EW_GREEN', phaseElapsed: 0, cycleSeconds: 17 },
    { id: 'university', name: 'Metro University', x: 560, y: 80, phase: 'EW_GREEN', phaseElapsed: 0, cycleSeconds: 20 },
    { id: 'park', name: 'Memorial Park', x: 260, y: 260, phase: 'NS_GREEN', phaseElapsed: 0, cycleSeconds: 16 },
  ];
}

function makeDefaultRoads(): Road[] {
  return [
    { id: 'r1', from: 'north', to: 'downtown', length: 220, lanes: 2, speedLimit: 35, type: 'arterial', closed: false, signalId: 'north' },
    { id: 'r2', from: 'downtown', to: 'east', length: 260, lanes: 2, speedLimit: 42, type: 'arterial', closed: false, signalId: 'downtown' },
    { id: 'r3', from: 'downtown', to: 'south', length: 260, lanes: 2, speedLimit: 30, type: 'collector', closed: false, signalId: 'downtown' },
    { id: 'r4', from: 'south', to: 'river', length: 240, lanes: 2, speedLimit: 28, type: 'collector', closed: false, signalId: 'south' },
    { id: 'r5', from: 'west', to: 'north', length: 260, lanes: 2, speedLimit: 32, type: 'arterial', closed: false, signalId: 'north' },
    { id: 'r6', from: 'west', to: 'park', length: 200, lanes: 2, speedLimit: 25, type: 'local', closed: false },
    { id: 'r7', from: 'park', to: 'downtown', length: 200, lanes: 2, speedLimit: 28, type: 'local', closed: false },
    { id: 'r8', from: 'downtown', to: 'university', length: 180, lanes: 2, speedLimit: 36, type: 'arterial', closed: false, signalId: 'downtown' },
    { id: 'r9', from: 'university', to: 'east', length: 200, lanes: 2, speedLimit: 38, type: 'arterial', closed: false, signalId: 'east' },
    { id: 'r10', from: 'east', to: 'stadium', length: 140, lanes: 2, speedLimit: 40, type: 'highway', closed: false },
    { id: 'r11', from: 'south', to: 'hospital', length: 200, lanes: 2, speedLimit: 32, type: 'arterial', closed: false },
    { id: 'r12', from: 'hospital', to: 'river', length: 190, lanes: 2, speedLimit: 32, type: 'arterial', closed: false },
    { id: 'r13', from: 'river', to: 'east', length: 220, lanes: 2, speedLimit: 34, type: 'collector', closed: false },
    { id: 'r14', from: 'west', to: 'south', length: 280, lanes: 2, speedLimit: 25, type: 'collector', closed: false },
  ];
}

export function createGameState(seed: string = DEFAULT_SEED): GameState {
  const intersections = makeDefaultIntersections();
  const roads = makeDefaultRoads();

  const baseState: GameState = {
    seed,
    timeOfDayMinutes: 355,
    day: 1,
    speed: 1,
    weather: 'clear',
    alertLevel: 'NORMAL',
    roads,
    intersections,
    vehicles: [],
    units: [],
    incidents: [
      {
        id: 'incident-1',
        type: 'Traffic Collision',
        category: 'traffic',
        severity: 'moderate',
        status: 'new',
        locationNode: 'downtown',
        x: 430,
        y: 220,
        roadId: 'r2',
        message: 'Two vehicles collided near Downtown. Motorists are queued.',
        durationMinutes: 25,
      },
    ],
    cameras: [
      { id: 'cam-1', name: 'Northside Camera', x: 200, y: 130, type: 'fixed', status: 'online', trafficFlow: 74 },
      { id: 'cam-2', name: 'Downtown CCTV', x: 430, y: 220, type: 'cctv', status: 'online', trafficFlow: 61 },
      { id: 'cam-3', name: 'Riverfront PTZ', x: 620, y: 430, type: 'ptz', status: 'online', trafficFlow: 55 },
      { id: 'cam-4', name: 'Stadium Highway', x: 900, y: 300, type: 'highway', status: 'online', trafficFlow: 70 },
    ],
    powerGrid: [
      { id: 'power-1', name: 'North Grid', district: 'north', status: 'online' },
      { id: 'power-2', name: 'Central Grid', district: 'downtown', status: 'online' },
      { id: 'power-3', name: 'East Grid', district: 'east', status: 'online' },
    ],
    waterGrid: [
      { id: 'water-1', name: 'River Mains', district: 'river', status: 'online' },
      { id: 'water-2', name: 'Downtown Mains', district: 'downtown', status: 'online' },
      { id: 'water-3', name: 'South Mains', district: 'south', status: 'online' },
    ],
    transit: [
      { id: 'bus-1', route: ['north', 'downtown', 'east'], status: 'running', x: 220, y: 150 },
      { id: 'bus-2', route: ['south', 'river', 'hospital'], status: 'running', x: 320, y: 470 },
    ],
    settings: { difficulty: 'standard', seed },
    stats: { totalIncidents: 1, averageResponse: '08m 20s', trafficDelay: 14 },
    rng: seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0),
  };

  const vehicleDefs: Array<[string, string, string, Vehicle['type']]> = [
    ['veh-1', 'north', 'south', 'sedan'],
    ['veh-2', 'west', 'east', 'suv'],
    ['veh-3', 'university', 'hospital', 'truck'],
    ['veh-4', 'east', 'north', 'sedan'],
    ['veh-5', 'park', 'stadium', 'bus'],
    ['veh-6', 'south', 'university', 'sedan'],
    ['veh-7', 'west', 'river', 'suv'],
    ['veh-8', 'hospital', 'park', 'truck'],
    ['veh-9', 'north', 'east', 'sedan'],
    ['veh-10', 'park', 'downtown', 'suv'],
  ];

  baseState.vehicles = vehicleDefs.map(([id, origin, destination, type]) =>
    makeVehicle(baseState, id, origin, destination, type),
  );

  baseState.units = [
    { id: 'pol-1', type: 'police', x: 300, y: 120, status: 'available', home: 'north', currentNode: 'north', route: [], etaMinutes: 0 },
    { id: 'fire-1', type: 'fire', x: 520, y: 180, status: 'available', home: 'downtown', currentNode: 'downtown', route: [], etaMinutes: 0 },
    { id: 'ems-1', type: 'ems', x: 770, y: 440, status: 'available', home: 'hospital', currentNode: 'hospital', route: [], etaMinutes: 0 },
    { id: 'tow-1', type: 'tow', x: 630, y: 280, status: 'available', home: 'river', currentNode: 'river', route: [], etaMinutes: 0 },
    { id: 'util-1', type: 'utility', x: 150, y: 340, status: 'available', home: 'west', currentNode: 'west', route: [], etaMinutes: 0 },
  ];

  return baseState;
}

function roadCost(state: GameState, road: Road): number {
  const vehicleLoad = state.vehicles.filter((vehicle) => vehicle.route.includes(road.id)).length;
  const congestionPenalty = 1 + vehicleLoad * 0.15;
  const weatherPenalty = weatherModifiers[state.weather].speed;
  return road.length * congestionPenalty * weatherPenalty;
}

export function computeRoute(state: GameState, startId: string, endId: string): string[] {
  if (startId === endId) return [startId];

  const adjacency = new Map<string, Road[]>();
  for (const road of state.roads) {
    if (road.closed) continue;
    if (!adjacency.has(road.from)) adjacency.set(road.from, []);
    adjacency.get(road.from)?.push(road);

    const reverse: Road = { ...road, from: road.to, to: road.from, id: `${road.id}-rev` };
    if (!adjacency.has(reverse.from)) adjacency.set(reverse.from, []);
    adjacency.get(reverse.from)?.push(reverse);
  }

  const distances = new Map<string, number>([[startId, 0]]);
  const previous = new Map<string, string | null>([[startId, null]]);
  const queue: Array<{ id: string; cost: number }> = [{ id: startId, cost: 0 }];

  while (queue.length > 0) {
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift();
    if (!current) break;
    if (current.id === endId) break;

    const neighbors = adjacency.get(current.id) ?? [];
    for (const road of neighbors) {
      const nextId = road.to;
      const weight = roadCost(state, road);
      const candidate = (distances.get(current.id) ?? Number.MAX_SAFE_INTEGER) + weight;
      if (candidate < (distances.get(nextId) ?? Number.MAX_SAFE_INTEGER)) {
        distances.set(nextId, candidate);
        previous.set(nextId, current.id);
        queue.push({ id: nextId, cost: candidate });
      }
    }
  }

  const route: string[] = [];
  let cursor: string | null = endId;
  while (cursor) {
    route.unshift(cursor);
    cursor = previous.get(cursor) ?? null;
  }

  return route.length > 0 ? route : [startId];
}

export function addIncident(
  state: GameState,
  type: string,
  category: IncidentCategory,
  severity: Incident['severity'],
  roadId?: string,
): GameState {
  const lane = ['north', 'downtown', 'east', 'south', 'west', 'river', 'hospital', 'stadium'];
  const randIndex = Math.abs(state.rng + Date.now()) % lane.length;
  const locationNode = lane[randIndex] ?? 'downtown';
  const node = getIntersectionById(state, locationNode) ?? state.intersections[0];

  const incident: Incident = {
    id: `incident-${Date.now()}-${state.rng}`,
    type,
    category,
    severity,
    status: 'new',
    locationNode,
    x: node.x,
    y: node.y,
    roadId,
    message: `${type} reported near ${node.name}. Response required.`,
    durationMinutes: 20,
  };

  return {
    ...state,
    incidents: [...state.incidents, incident],
    stats: { ...state.stats, totalIncidents: state.stats.totalIncidents + 1 },
  };
}

export function dispatchUnitForIncident(state: GameState, incidentId: string, unitType: UnitType): GameState {
  const incident = state.incidents.find((entry) => entry.id === incidentId);
  if (!incident) return state;

  const unit = state.units.find((candidate) => candidate.type === unitType && candidate.status === 'available');
  if (!unit) return state;

  const route = computeRoute(state, unit.currentNode, incident.locationNode);

  return {
    ...state,
    units: state.units.map((candidate) =>
      candidate.id === unit.id
        ? {
            ...candidate,
            status: 'en_route',
            assignment: incidentId,
            route,
            etaMinutes: Math.max(3, route.length * 2),
          }
        : candidate,
    ),
    incidents: state.incidents.map((entry) =>
      entry.id === incidentId ? { ...entry, status: 'responding' } : entry,
    ),
  };
}

export function toggleRoadClosure(state: GameState, roadId: string): GameState {
  const targetRoad = state.roads.find((road) => road.id === roadId);
  if (!targetRoad) return state;

  return {
    ...state,
    roads: state.roads.map((road) =>
      road.id === roadId ? { ...road, closed: !road.closed } : road,
    ),
  };
}

export function updateGameState(state: GameState, dt: number): GameState {
  const updatedTime = state.timeOfDayMinutes + dt * 60;
  let nextWeather: WeatherType = 'clear';
  const hour = (Math.floor(updatedTime / 60) % 24) + 1;
  if (hour >= 15 && hour < 18) nextWeather = 'rain';
  else if (hour >= 19 && hour < 21) nextWeather = 'storm';
  else if (hour >= 3 && hour < 5) nextWeather = 'fog';

  const intersections = state.intersections.map((intersection) => {
    const phaseIndex = signalPhases.indexOf(intersection.phase);
    const phaseElapsed = intersection.phaseElapsed + dt;
    const nextPhase = phaseElapsed >= 8 ? signalPhases[(phaseIndex + 1) % signalPhases.length] : intersection.phase;
    return { ...intersection, phase: nextPhase, phaseElapsed: phaseElapsed % 10 };
  });

  const vehicles = state.vehicles.map((vehicle) => {
    const route = vehicle.route.length > 0 ? vehicle.route : [vehicle.currentNode];
    const nextIndex = Math.min(route.length - 1, vehicle.routeIndex + 1);
    const targetNode = route[nextIndex] ?? vehicle.currentNode;
    const targetIntersection = getIntersectionById(state, targetNode) ?? state.intersections[0];
    const currentIntersection = getIntersectionById(state, vehicle.currentNode) ?? state.intersections[0];
    const dx = targetIntersection.x - currentIntersection.x;
    const dy = targetIntersection.y - currentIntersection.y;
    const distance = Math.hypot(dx, dy) || 1;
    const movement = Math.min(1, (vehicle.speed * dt) / Math.max(distance, 1));

    const baseX = currentIntersection.x + dx * movement;
    const baseY = currentIntersection.y + dy * movement;

    let nextRouteIndex = vehicle.routeIndex;
    let nextCurrentNode = vehicle.currentNode;
    if (distance < 5) {
      nextCurrentNode = targetNode;
      nextRouteIndex = Math.min(route.length - 1, vehicle.routeIndex + 1);
    }

    return {
      ...vehicle,
      x: baseX,
      y: baseY,
      currentNode: nextCurrentNode,
      targetNode,
      routeIndex: nextRouteIndex,
      speed: Math.max(0, vehicle.speed * weatherModifiers[nextWeather].speed),
      state: distance < 8 ? 'stopped' : 'moving',
    };
  });

  const units = state.units.map((unit) => {
    if (unit.status === 'available') return unit;
    const nextEta = Math.max(0, unit.etaMinutes - dt / 60);
    const status = nextEta <= 0 ? 'on_scene' : 'en_route';
    return { ...unit, etaMinutes: nextEta, status };
  });

  const incidents = state.incidents.map((incident) => {
    if (incident.status === 'resolved') return incident;
    const updatedDuration = Math.max(0, incident.durationMinutes - dt * 0.7);
    const nextStatus: IncidentStatus = updatedDuration <= 0 ? 'resolved' : incident.status;
    return { ...incident, durationMinutes: updatedDuration, status: nextStatus };
  });

  let nextState: GameState = {
    ...state,
    timeOfDayMinutes: updatedTime,
    weather: nextWeather,
    intersections,
    vehicles,
    units,
    incidents,
    rng: (state.rng + Math.floor(dt * 1000)) % 100000,
  };

  if (incidents.length < incidentsForDifficulty[nextState.settings.difficulty]) {
    nextState = addIncident(nextState, 'Signal Fault', 'infrastructure', 'minor');
  }

  nextState.stats = {
    totalIncidents: nextState.incidents.length,
    averageResponse: `${String(7 + nextState.incidents.length).padStart(2, '0')}m ${String(10 + (nextState.rng % 50)).padStart(2, '0')}s`,
    trafficDelay: Math.max(10, Math.round(nextState.vehicles.length * 2 + nextState.incidents.length * 3)),
  };

  if (nextState.incidents.some((incident) => incident.status !== 'resolved')) {
    nextState.alertLevel = 'WATCH';
  } else {
    nextState.alertLevel = 'NORMAL';
  }

  return nextState;
}

export function resolutionStates(state: GameState) {
  return state.incidents.filter((incident) => incident.status === 'resolved').length;
}

export const nodes = Object.values(intersectionMap);

export default GameState;

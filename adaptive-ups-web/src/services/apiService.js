function parseNum(val, fallback = 0) {
  if (val === null || val === undefined || val === '') return fallback;
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

const PRIMARY_API = 'https://adaptive-ups-v81g.onrender.com';
const FALLBACK_API = 'http://localhost:5000';

class ApiService {
  constructor(baseUrl = PRIMARY_API) {
    this.baseUrl = baseUrl;
  }

  async _request(path, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  async fetchSensorData() {
    const data = await this._request('/data');
    const c1 = parseNum(data.current1, 0);
    const c2 = parseNum(data.current2, 0);
    const totalC = parseNum(data.current, c1 + c2);
    const batt = parseNum(data.battery, 100);
    const defaultDcV = 9.0 + (batt / 100.0) * 3.6;
    return {
      temperature: parseNum(data.temperature, 25),
      humidity: parseNum(data.humidity, 50),
      distance: parseNum(data.distance, 100),
      battery: batt,
      inputVoltage: parseNum(data.inputVoltage, 220),
      dcVoltage: parseNum(data.dcVoltage, defaultDcV),
      dcCurrent: parseNum(data.dcCurrent, 0),
      current: totalC,
      current1: c1,
      current2: c2,
      ina226BusVoltage: parseNum(data.ina226BusVoltage, parseNum(data.dcVoltage, defaultDcV)),
      ina226ShuntVoltage: parseNum(data.ina226ShuntVoltage, 0),
      ina226Current: parseNum(data.ina226Current, parseNum(data.dcCurrent, 0)),
      ina226Power: parseNum(data.ina226Power, 0),
      ina226Online: data.ina226Online === true,
    };
  }

  async fetchLoads() {
    const map = await this._request('/loads');
    return {
      load1: map.load1 !== false,
      load2: map.load2 !== false,
      supply: map.supply !== false && map.source !== false,
      source: map.source !== false && map.supply !== false,
      battSupply: map.battSupply !== false && map['4'] !== false,
      charger: map.charger !== false && map['5'] !== false,
      espOnline: map.espOnline === true,
      lastEspSeen: map.lastEspSeen || null,
    };
  }

  async setLoadState(id, targetState = null) {
    const target =
      id === 3 || id === '3' || id === 'supply' || id === 'source'
        ? 'supply'
        : id === 4 || id === '4' || id === 'battSupply' || id === 'battery'
        ? 'battSupply'
        : id === 5 || id === '5' || id === 'charger'
        ? 'charger'
        : typeof id === 'number'
        ? `load${id}`
        : `${id}`;

    const body = targetState !== null ? JSON.stringify({ state: targetState }) : undefined;
    const method = 'POST';

    const data = await this._request(`/load/${target}`, {
      method,
      body,
    });
    return data.state === true;
  }

  async batchSetLoads({ load1, load2, supply, battSupply, charger }) {
    const body = {};
    if (load1 !== undefined) body.load1 = load1;
    if (load2 !== undefined) body.load2 = load2;
    if (supply !== undefined) {
      body.supply = supply;
      body.source = supply;
    }
    if (battSupply !== undefined) body.battSupply = battSupply;
    if (charger !== undefined) body.charger = charger;

    return await this._request('/loads/set', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async fetchSettings() {
    try {
      const data = await this._request('/api/settings');
      return {
        lowBatteryThreshold: parseNum(data.lowBatteryThreshold, 25),
        criticalThreshold: parseNum(data.criticalThreshold, 5),
        priorityLoad: String(data.priorityLoad || 'load1'),
      };
    } catch {
      return {
        lowBatteryThreshold: 25,
        criticalThreshold: 5,
        priorityLoad: 'load1',
      };
    }
  }

  async upsertSettings(settings) {
    return await this._request('/api/settings', {
      method: 'POST',
      body: JSON.stringify({
        lowBatteryThreshold: settings.lowBatteryThreshold,
        criticalThreshold: settings.criticalThreshold,
        priorityLoad: settings.priorityLoad,
      }),
    });
  }

  async updateEnvironment({ temperature, humidity, distance, battery, inputVoltage, current = 0.0 }) {
    return await this._request('/data', {
      method: 'POST',
      body: JSON.stringify({
        temperature,
        humidity,
        distance,
        battery,
        inputVoltage,
        current,
      }),
    });
  }

  // --- SIMULATION API ENDPOINTS ---

  async fetchSimulationStatus() {
    return await this._request('/simulation/status');
  }

  async startSimulation() {
    const res = await this._request('/simulation/start', { method: 'POST' });
    return res.status;
  }

  async pauseSimulation() {
    const res = await this._request('/simulation/pause', { method: 'POST' });
    return res.status;
  }

  async resumeSimulation() {
    const res = await this._request('/simulation/resume', { method: 'POST' });
    return res.status;
  }

  async stopSimulation() {
    const res = await this._request('/simulation/stop', { method: 'POST' });
    return res.status;
  }

  async resetSimulation() {
    const res = await this._request('/simulation/reset', { method: 'POST' });
    return res.status;
  }

  async setBatterySource(source) {
    const res = await this._request('/simulation/source', {
      method: 'POST',
      body: JSON.stringify({ source }),
    });
    return res.status;
  }

  async setSimulationSpeed(speed) {
    const res = await this._request('/simulation/speed', {
      method: 'POST',
      body: JSON.stringify({ speed }),
    });
    return res.status;
  }

  async setTempSpeed(speed) {
    const res = await this._request('/simulation/temp/speed', {
      method: 'POST',
      body: JSON.stringify({ speed }),
    });
    return res.status;
  }

  async setTempMode(mode, target = null) {
    const res = await this._request('/simulation/temp/mode', {
      method: 'POST',
      body: JSON.stringify({ mode, target }),
    });
    return res.status;
  }

  async setTempProfile(profile) {
    const res = await this._request('/simulation/temp/profile', {
      method: 'POST',
      body: JSON.stringify({ profile }),
    });
    return res.status;
  }

  async triggerScenario(scenario) {
    const res = await this._request('/simulation/scenario', {
      method: 'POST',
      body: JSON.stringify({ scenario }),
    });
    return res.status;
  }

  async updateLoadPriority(id, { priority, powerRating, name, thermalSensitivity }) {
    return await this._request(`/loads/${id}/priority`, {
      method: 'PUT',
      body: JSON.stringify({ priority, powerRating, name, thermalSensitivity }),
    });
  }
}

export const primaryApi = new ApiService(PRIMARY_API);
export const fallbackApi = new ApiService(FALLBACK_API);

let cachedFastApi = null;

export async function safeApiCall(fn) {
  if (cachedFastApi) {
    try {
      return await fn(cachedFastApi);
    } catch {
      cachedFastApi = null;
    }
  }
  try {
    const result = await fn(fallbackApi);
    cachedFastApi = fallbackApi;
    return result;
  } catch {
    try {
      const result = await fn(primaryApi);
      cachedFastApi = primaryApi;
      return result;
    } catch (err) {
      throw err;
    }
  }
}

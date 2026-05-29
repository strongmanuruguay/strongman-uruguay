// ===== SUPABASE INTEGRATION - STRONGMAN URUGUAY =====
// Este archivo maneja la conexión con Supabase para las secciones manuales
// Tablas: eventos, atletas, ranking_nacional, records

const SUPABASE_URL = 'https://kiojyhfqwjaoppgwoyjt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_1MUOcELIRMoDlKdpUA7_fw_gYJ2dQHE';
let supabaseClient = null;

function initSupabaseMain() {
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        try {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            console.log('✅ Supabase conectado');
            return true;
        } catch(e) {
            console.error('❌ Error conectando Supabase:', e);
            return false;
        }
    }
    console.warn('⚠️ Librería Supabase no cargada');
    return false;
}

// ===== CARGAR DATOS DESDE SUPABASE =====
async function loadDataFromSupabase() {
    if (!supabaseClient) initSupabaseMain();
    if (!supabaseClient) return false;

    try {
        // Cargar eventos
        const { data: eventsData, error: eventsError } = await supabaseClient
            .from('eventos')
            .select('*')
            .order('fecha', { ascending: true });

        if (!eventsError && eventsData) {
            data.events = eventsData;
            console.log('✅ Eventos cargados:', eventsData.length);
        }

        // Cargar atletas
        const { data: athletesData, error: athletesError } = await supabaseClient
            .from('atletas')
            .select('*')
            .order('nombre', { ascending: true });

        if (!athletesError && athletesData) {
            data.athletes = athletesData;
            console.log('✅ Atletas cargados:', athletesData.length);
        }

        // Cargar ranking nacional
        const { data: rankingData, error: rankingError } = await supabaseClient
            .from('ranking_nacional')
            .select('*')
            .order('posicion', { ascending: true });

        if (!athletesError && rankingData) {
            data.ranking = rankingData;
            console.log('✅ Ranking cargado:', rankingData.length);
        }

        // Cargar records
        const { data: recordsData, error: recordsError } = await supabaseClient
            .from('records')
            .select('*')
            .order('categoria', { ascending: true });

        if (!recordsError && recordsData) {
            data.records = recordsData;
            console.log('✅ Records cargados:', recordsData.length);
        }

        return true;
    } catch (e) {
        console.error('Error cargando desde Supabase:', e);
        return false;
    }
}

// ===== GUARDAR DATOS EN SUPABASE =====
async function saveDataToSupabase() {
    if (!supabaseClient) initSupabaseMain();
    if (!supabaseClient) return false;

    try {
        // Guardar eventos
        if (data.events && data.events.length > 0) {
            await supabaseClient.from('eventos').delete().neq('id', 0);
            await supabaseClient.from('eventos').insert(data.events);
        }

        // Guardar atletas
        if (data.athletes && data.athletes.length > 0) {
            await supabaseClient.from('atletas').delete().neq('id', 0);
            await supabaseClient.from('atletas').insert(data.athletes);
        }

        // Guardar ranking
        if (data.ranking && data.ranking.length > 0) {
            await supabaseClient.from('ranking_nacional').delete().neq('id', 0);
            await supabaseClient.from('ranking_nacional').insert(data.ranking);
        }

        // Guardar records
        if (data.records && data.records.length > 0) {
            await supabaseClient.from('records').delete().neq('id', 0);
            await supabaseClient.from('records').insert(data.records);
        }

        console.log('✅ Datos guardados en Supabase');
        return true;
    } catch (e) {
        console.error('Error guardando en Supabase:', e);
        return false;
    }
}

// ===== CARGAR COMPETENCIAS DESDE SUPABASE (STRONGSCORE) =====
async function renderCompetenciasPublico() {
    const container = document.getElementById('competenciasPublicoContainer');
    if (!container) return;

    container.innerHTML = '<div class="loading-spinner"><i class="fas fa-circle-notch"></i> Cargando competencias desde la nube...</div>';

    if (!supabaseClient) initSupabaseMain();

    let competencias = [];
    let fromSupabase = false;

    if (supabaseClient) {
        try {
            const { data: compData, error } = await supabaseClient
                .from('competencias')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (!error && compData && compData.length > 0) {
                competencias = compData;
                fromSupabase = true;
                console.log('✅ Competencias cargadas:', compData.length);
            }
        } catch (e) {
            console.error('Error:', e);
        }
    }

    if (competencias.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-plus"></i>
                <p>No hay competencias registradas aún</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem; color: var(--text-muted);">
                    Las competencias aparecerán aquí cuando se creen desde StrongScore Pro V3
                </p>
            </div>
        `;
        return;
    }

    let html = '<div class="competencias-grid">';
    competencias.forEach(comp => {
        const dataJson = comp.data_json || {};
        const statusClass = comp.estado === 'activo' ? 'en-curso' : '';
        const statusText = comp.estado || 'programado';

        let fechaStr = 'Fecha por definir';
        if (comp.fecha || dataJson.fec) {
            try {
                const d = new Date(comp.fecha || dataJson.fec);
                fechaStr = d.toLocaleDateString('es-UY', {day: 'numeric', month: 'long', year: 'numeric'});
            } catch(e) {}
        }

        const numAtletas = dataJson.atl ? dataJson.atl.length : 0;
        const numPruebas = dataJson.prb ? dataJson.prb.length : 0;
        const nombre = comp.nombre || dataJson.nom || 'Competencia';
        const lugar = comp.lugar || dataJson.lug || '';

        html += `
            <div class="competencia-card ${statusClass}">
                <div class="competencia-status ${statusText}">
                    ${comp.estado === 'activo' ? '🔴 En Vivo' : comp.estado === 'finalizado' ? '✅ Finalizado' : '📅 Programado'}
                </div>
                <div class="competencia-nombre">${nombre}</div>
                <div class="competencia-fecha"><i class="fas fa-calendar"></i> ${fechaStr}</div>
                ${lugar ? `<div class="competencia-lugar"><i class="fas fa-map-marker-alt"></i> ${lugar}</div>` : ''}
                <div style="margin-top: 0.8rem; padding-top: 0.8rem; border-top: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); font-size: 0.85rem;">
                    <i class="fas fa-users"></i> ${numAtletas} atletas &nbsp;|&nbsp; 
                    <i class="fas fa-dumbbell"></i> ${numPruebas} pruebas
                </div>
            </div>
        `;
    });
    html += '</div>';

    if (fromSupabase) {
        html += `<p style="text-align: center; color: var(--success); margin-top: 1rem; font-size: 0.85rem;">
            <i class="fas fa-cloud"></i> Datos sincronizados desde la nube
        </p>`;
    }

    container.innerHTML = html;
}

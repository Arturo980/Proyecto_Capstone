const texts = {
  en: {
    navbar_home: 'Home',
    navbar_teams: 'Teams',
    navbar_statistics: 'Statistics',
    navbar_games: 'Games',
    navbar_upcoming_games: 'Games',
    navbar_media: 'Media',
    navbar_news: "News",
    navbar_requests: "Registration Requests",
    navbar_audit: "Audit",
    navbar_language: 'Language',
    carousel_news_1: 'News 1',
    carousel_news_2: 'News 2',
    carousel_news_3: 'News 3',
    carousel_description_1: 'Brief description of news 1.',
    carousel_description_2: 'Brief description of news 2.',
    carousel_description_3: 'Brief description of news 3.',
    standings_title: 'Standings Table',
    past_games_title: 'Past Games',
    past_games: 'Past Games',
    ongoing_games: 'Ongoing Games',
    upcoming_games: 'Games',
    theme: 'Theme',
    theme_light: 'Light Mode',
    theme_dark: 'Dark Mode',
    footer_rights: 'All rights reserved.',
    footer_follow_us: 'Follow us on:',
    vs: 'vs',
    teams_title: "Teams",
    league_name_label: "League Name:",
    league_name_placeholder: "Enter league name",
    number_of_teams_label: "Number of Teams:",
    league_label: "League:",
    not_set: "Not set",
    // NUEVO: Traducciones para configuración de liga
    league_design: "League Design",
    sets_label: "Sets:",
    last_set_points_label: "Last set points:",
    save: "Save",
    delete_league: "Delete League",
    create_new_league: "Create New League",
    create_league: "Create League",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    view: "View",
    add_team: "Add Team",
    add_game: "Add Game",
    edit_game: "Edit Game",
    edit_score: "Edit Score",
    save_changes: "Save Changes",
    confirm_deletion: "Confirm Deletion",
    are_you_sure_delete_league: "Are you sure you want to delete this league and all its teams?",
    are_you_sure_delete_team: "Are you sure you want to delete this team?",
    are_you_sure_delete_game: "Are you sure you want to delete this game?",
    no_games_for_date: "No games scheduled for this date.",
    select_league: "Select League:",
    select_team: "Select a team from the list",
    called_players: "Called Players",
    select_teams_to_see_roster: "Select teams to see roster",
    score: "Score",
    sets_team1: "Sets Team 1",
    sets_team2: "Sets Team 2",
    points_team1: "Score Team 1",
    points_team2: "Score Team 2",
    date: "Date",
    time: "Time",
    team1: "Team 1",
    team2: "Team 2",
    player_name: "Player",
    team: "Team",
    blocks_per_set: "Blocks per set",
    assists_per_set: "Assists per set",
    aces_per_set: "Aces per set",
    attacks_per_set: "Attacks per set",
    digs_per_set: "Digs per set",
    hitting_percentage: "Hitting %",
    kills_per_set: "Kills per set",
    points_per_set: "Points per set",
    search_player_team: "Search player or team",
    loading_stats: "Loading statistics...",
    no_stats_data: "No statistics data available.",
    // Modal translations
    confirm: "Confirm",
    ok: "OK",
    success: "Success",
    error: "Error",
    warning: "Warning",
    info: "Information",
    // News specific
    news: "News",
    add_news: "Add News",
    edit_news: "Edit News",
    delete_news: "Delete News",
    confirm_delete_news: "Are you sure you want to delete this news?",
    news_deleted_successfully: "News deleted successfully",
    error_deleting_news: "Error deleting news",
    loading: "Loading...",
    no_news_available: "No news available.",
    preview: "Preview",
    gallery: "Gallery:",
    select_news_to_preview: "Select a news item to preview it here.",
    back_to_news: "Back to News",
    // News Editor specific
    title: "Title",
    content: "Content",
    main_image_required: "Main Image (required)",
    additional_images_optional: "Additional Images (optional)",
    remove_main_image: "Remove main image",
    remove: "Remove",
    publish_news: "Publish News",
    publishing: "Publishing...",
    publish: "Publish",
    saving: "Saving...",
    title_placeholder: "Title...",
    content_placeholder: "Content...",
    error_loading_news: "Error loading news.",
    title_content_image_required: "Title, content and main image are required.",
    error_saving_news: "Error saving news",
    // Player positions
    position_armador: "Setter",
    position_punta: "Outside Hitter", 
    position_central: "Middle Blocker",
    position_opuesto: "Opposite Hitter",
    position_libero: "Libero",
    position_sin_posicion: "No Position",
    // Coach related
    coach: "Coach",
    coach_name: "Coach Name",
    manage_coach: "Manage Coach",
    add_coach: "Add Coach",
    edit_coach: "Edit Coach",
    remove_coach: "Remove Coach",
    // ...add more as needed for modals/forms...
  },
  es: {
    navbar_home: 'Inicio',
    navbar_teams: 'Equipos',
    navbar_statistics: 'Estadísticas',
    navbar_games: 'Partidos',
    navbar_upcoming_games: 'Partidos',
    navbar_media: 'Galería',
    navbar_news: "Noticias",
    navbar_requests: "Solicitudes de Registro",
    navbar_audit: "Auditoría",
    navbar_language: 'Idioma',
    carousel_news_1: 'Noticia 1',
    carousel_news_2: 'Noticia 2',
    carousel_news_3: 'Noticia 3',
    carousel_description_1: 'Descripción breve de la noticia 1.',
    carousel_description_2: 'Descripción breve de la noticia 2.',
    carousel_description_3: 'Descripción breve de la noticia 3.',
    standings_title: 'Tabla de Posiciones',
    past_games_title: 'Partidos Jugados',
    past_games: 'Partidos Jugados',
    ongoing_games: 'Partidos en Curso',
    upcoming_games: 'Partidos',
    theme: 'Tema',
    theme_light: 'Modo Claro',
    theme_dark: 'Modo Oscuro',
    footer_rights: 'Todos los derechos reservados.',
    footer_follow_us: 'Síguenos en:',
    vs: 'vs',
    teams_title: "Equipos",
    league_name_label: "Nombre de la Liga:",
    league_name_placeholder: "Ingrese el nombre de la liga",
    number_of_teams_label: "Cantidad de Equipos:",
    league_label: "Liga:",
    not_set: "No definida",
    // NUEVO: Traducciones para configuración de liga
    league_design: "Diseño de Liga",
    sets_label: "Sets:",
    last_set_points_label: "Puntos último set:",
    save: "Guardar",
    delete_league: "Eliminar Liga",
    create_new_league: "Crear Nueva Liga",
    create_league: "Crear Liga",
    cancel: "Cancelar",
    edit: "Editar",
    delete: "Eliminar",
    view: "Ver",
    add_team: "Agregar Equipo",
    add_game: "Agregar Partido",
    edit_game: "Editar Partido",
    edit_score: "Editar Marcador",
    save_changes: "Guardar Cambios",
    confirm_deletion: "Confirmar Eliminación",
    are_you_sure_delete_league: "¿Seguro que deseas eliminar esta liga y todos sus equipos?",
    are_you_sure_delete_team: "¿Seguro que deseas eliminar este equipo?",
    are_you_sure_delete_game: "¿Seguro que deseas eliminar este partido?",
    no_games_for_date: "No hay partidos programados para esta fecha.",
    select_league: "Selecciona Liga:",
    select_team: "Selecciona un equipo de la lista",
    called_players: "Citados",
    select_teams_to_see_roster: "Selecciona equipos para ver la plantilla",
    score: "Marcador",
    sets_team1: "Sets Equipo 1",
    sets_team2: "Sets Equipo 2",
    points_team1: "Puntos Equipo 1",
    points_team2: "Puntos Equipo 2",
    date: "Fecha",
    time: "Hora",
    team1: "Equipo 1",
    team2: "Equipo 2",
    player_name: "Jugador",
    team: "Equipo",
    blocks_per_set: "Bloqueos por set",
    assists_per_set: "Asistencias por set",
    aces_per_set: "Aces por set",
    attacks_per_set: "Ataques por set",
    digs_per_set: "Defensas por set",
    hitting_percentage: "% Ataque",
    kills_per_set: "Remates por set",
    points_per_set: "Puntos por set",
    search_player_team: "Buscar jugador o equipo",
    loading_stats: "Cargando estadísticas...",
    no_stats_data: "No hay datos de estadísticas disponibles.",
    // Modal translations
    confirm: "Confirmar",
    ok: "OK", 
    success: "Éxito",
    error: "Error",
    warning: "Advertencia", 
    info: "Información",
    // News specific
    news: "Noticias",
    add_news: "Agregar Noticia",
    edit_news: "Editar Noticia", 
    delete_news: "Eliminar Noticia",
    confirm_delete_news: "¿Estás seguro de que quieres eliminar esta noticia?",
    news_deleted_successfully: "Noticia eliminada exitosamente",
    error_deleting_news: "Error al eliminar la noticia",
    loading: "Cargando...",
    no_news_available: "No hay noticias.",
    preview: "Previsualización",
    gallery: "Galería:",
    select_news_to_preview: "Selecciona una noticia para previsualizarla aquí.",
    back_to_news: "Volver a Noticias",
    // News Editor specific
    title: "Título",
    content: "Contenido", 
    main_image_required: "Imagen Principal (obligatoria)",
    additional_images_optional: "Imágenes adicionales (opcional)",
    remove_main_image: "Eliminar imagen principal",
    remove: "Eliminar",
    publish_news: "Publicar Noticia",
    publishing: "Publicando...",
    publish: "Publicar",
    saving: "Guardando...",
    title_placeholder: "Título...",
    content_placeholder: "Contenido...",
    error_loading_news: "Error al cargar la noticia.",
    title_content_image_required: "Título, contenido e imagen principal son obligatorios.",
    error_saving_news: "Error al guardar la noticia",
    // Player positions
    position_armador: "Armador",
    position_punta: "Punta", 
    position_central: "Central",
    position_opuesto: "Opuesto",
    position_libero: "Líbero",
    position_sin_posicion: "Sin Posición",
    // Coach related
    coach: "Entrenador",
    coach_name: "Nombre del Entrenador",
    manage_coach: "Gestionar Entrenador",
    add_coach: "Agregar Entrenador",
    edit_coach: "Editar Entrenador",
    remove_coach: "Eliminar Entrenador",
    // ...agrega más según lo que uses en los modales y formularios...
  },
};

export default texts;

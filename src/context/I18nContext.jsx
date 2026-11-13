import React, { createContext, useContext, useState, useEffect } from 'react';

const I18nContext = createContext(null);

const translations = {
  da: {
    'Only recorded age groups are shown. Percentages are based on visitors with a recorded age.': 'Kun registrerede aldersgrupper vises. Procenterne er baseret på besøgende med en registreret alder.',
    'Homepage': 'Forside',
    'Packages': 'Pakker',
    'Scholarship': 'Legatet',
    'Student clothing': 'Studentertøj',
    'Entry page not recorded': 'Landingsside ikke registreret',
    'These sessions were counted, but their entry page was not recorded.': 'Sessionerne er talt med, men deres landingsside blev ikke registreret.',
    // Sidebar nav
    'Executive': 'Ledelse',
    'Audience': 'Publikum',
    'Configurators': 'Konfiguratorer',
    'Conversions': 'Konverteringer',
    'Customer Journey': 'Kunderejse',
    'Marketing Intel': 'Marketing Data',
    'Visitor Data': 'Besøgsdata',
    'Settings': 'Indstillinger',
    'Search metrics...': 'Søg målinger...',
    'Admin': 'Administrator',
    'Sign Out': 'Log ud',
    'Profile Settings': 'Profilindstillinger',
    'User Management': 'Brugeradministration',
    'Customer Intel': 'Kunde Data',
    'Collapse': 'Skjul',
    // Date presets
    'Today': 'I dag',
    'Last 7 Days': 'Sidste 7 dage',
    'Last 30 Days': 'Sidste 30 dage',
    'All Time': 'Alle tider',
    // Executive
    'Executive Summary': 'Ledelsesoversigt',
    'High-level overview of platform performance and growth': 'Overordnet oversigt over platformens ydeevne og vækst',
    'Total Revenue': 'Samlet omsætning',
    'All-time generated revenue': 'Samlet genereret omsætning',
    'Total Visitors': 'Besøgende i alt',
    'Unique tracked visitors': 'Unikke sporede besøgende',
    'Total Conversions': 'Konverteringer i alt',
    'Completed purchases': 'Gennemførte køb',
    'Conversion Rate': 'Konverteringsrate',
    'Visitors → purchasers': 'Besøgende → købere',
    'Engagement Heatmap': 'Engagements-varmekort',
    'Activity density over time': 'Aktivitetstæthed over tid',
    'Platform Navigation': 'Platform Navigation',
    'Visitor Directory': 'Besøgsliste',
    'Search and replay sessions': 'Søg og afspil sessioner',
    'Funnel Analysis': 'Tragteanalyse',
    'Configurator drop-offs': 'Konfigurator-fraflytninger',
    'Audience Demographics': 'Publikumsdemografi',
    'Breakdown by school & edu': 'Opdeling efter skole & uddannelse',
    'Conversion Intelligence': 'Konverterings-intelligens',
    'Segment performance': 'Segmentpræstation',
    'Connection Error': 'Forbindelsesfejl',
    'Could not fetch data. Check your backend connection.': 'Kunne ikke hente data. Tjek din backendtilslutning.',
    // Audience
    'Audience Intelligence': 'Publikums-intelligens',
    'Visitor demographics, segmentation, and preferences': 'Besøgendes demografi, segmentering og præferencer',
    'Education Segment Distribution': 'Fordeling af uddannelsessegment',
    'Package Preference Split': 'Pakke præference opdeling',
    'Anticipated Graduation Year': 'Forventet uddannelsesår',
    'Top 10 Schools by Engagement': 'Top 10 skoler efter engagement',
    'users': 'brugere',
    'No data yet': 'Ingen data endnu',
    'Detailed reports': 'Detaljerede rapporter',
    'Pages': 'Sider',
    'Landing pages': 'Landingssider',
    'Sources': 'Kilder',
    'Events': 'Hændelser',
    'Cities': 'Byer',
    'Tech': 'Teknologi',
    'Demographics': 'Demografi',
    'Every page on the site with views, users and engagement': 'Alle sider på sitet med visninger, brugere og engagement',
    'First page of each session — where visitors enter': 'Første side i hver session – hvor besøgende lander',
    'Source / medium of each session': 'Kilde / medie for hver session',
    'Every tracked event and how often it fires': 'Alle sporede hændelser og hvor ofte de udløses',
    'Where your visitors are located': 'Hvor dine besøgende befinder sig',
    'Browser and operating system': 'Browser og styresystem',
    'Age bracket and gender': 'Aldersgruppe og køn',
    'Age and gender are only available when Google signals is enabled in GA4 — visitors without it show as "unknown".': 'Alder og køn er kun tilgængelige, når Google-signaler er slået til i GA4 – besøgende uden det vises som "unknown".',
    'Views': 'Visninger',
    'Users': 'Brugere',
    'Sessions': 'Sessioner',
    'Views / user': 'Visninger / bruger',
    'Avg. engagement': 'Gns. engagement',
    'Bounce rate': 'Afvisningsprocent',
    'Engagement': 'Engagement',
    'Count': 'Antal',
    'Per user': 'Pr. bruger',
    'Search...': 'Søg...',
    'Showing': 'Viser',
    'Show more': 'Vis flere',
    'Could not load this report.': 'Rapporten kunne ikke indlæses.',
    'No results match your search.': 'Ingen resultater matcher din søgning.',
    'No data for the selected range.': 'Ingen data for den valgte periode.',
    'Visitors': 'Besøgende',
    'Visitors in selected range': 'Besøgende i valgt periode',
    'With education profile': 'Med uddannelsesprofil',
    'Schools represented': 'Repræsenterede skoler',
    'Most popular package': 'Mest populære pakke',
    'of visitors': 'af besøgende',
    'visitors with a school': 'besøgende med skole',
    'of package choices': 'af pakkevalg',
    'profiled visitors': 'profilerede besøgende',
    'choices': 'valg',
    'Total': 'I alt',
    'Show all': 'Vis alle',
    'Show less': 'Vis færre',
    'segments': 'segmenter',
    'Graduation year data will appear here once visitors share it.': 'Data om uddannelsesår vises her, når besøgende deler det.',
    'Premium': 'Premium',
    'Standard': 'Standard',
    'Luksus': 'Luksus',
    'Basic': 'Basic',
    'Package Performance': 'Pakkepræstation',
    'Package Conversion Performance': 'Pakke konverteringspræstation',
    'Luksus': 'Luksus',
    'Basic': 'Basic',
    'Package Performance': 'Pakkepræstation',
    'Package Conversion Performance': 'Pakke konverteringspræstation',
    // Journey
    'Customer Journey Analytics': 'Kunderejse-analyse',
    'Lifecycle tracking, behavioral insights, and returning visitor metrics': 'Livscyklussporing, adfærdsindsigt og returbesøgsmålinger',
    'Avg. Visits': 'Gns. besøg',
    'Average visits before a purchase occurs': 'Gennemsnitlige besøg inden et køb sker',
    'Return Interval': 'Returinterval',
    'Average days between recurring visits': 'Gennemsnitlige dage mellem tilbagevendende besøg',
    'Time to Convert': 'Tid til konvertering',
    'Average minutes from first visit to purchase': 'Gennemsnitlige minutter fra første besøg til køb',
    'Loyalty Base': 'Loyalitetsbasis',
    'Number of users who visited multiple times': 'Antal brugere der besøgte flere gange',
    'Return Visitor Behavior': 'Returbesøgende adfærd',
    'Journey Analysis': 'Rejseanalyse',
    'Tracking user behavior from their first interaction to final purchase. Users typically require multiple touchpoints before committing to a configurator purchase.': 'Sporing af brugeradfærd fra første interaktion til endelig køb. Brugere kræver typisk flere berøringspunkter, inden de forpligter sig til et konfiguratorkøb.',
    'Discovery Phase': 'Opdagelsesfase',
    'Users land on WordPress site and enter configurators.': 'Brugere lander på WordPress-siden og åbner konfiguratorer.',
    'Consideration': 'Overvejelse',
    'Users return ~{days} days later to finalize designs.': 'Brugere vender tilbage ~{days} dage senere for at færdiggøre designs.',
    'Returning': 'Tilbagevendende',
    'Single Visit': 'Enkelt besøg',
    'Return Rate': 'Tilbagevendende rate',
    // Marketing
    'Marketing Intelligence': 'Marketing-intelligens',
    'Audience growth, entry points, and remarketing segments': 'Publikumsvækst, indgangspunkter og remarketing-segmenter',
    'Audience Growth Trends': 'Publikumsvæksttendenser',
    'High Intent Segments': 'Høj-intentionssegmenter',
    'Audiences ready for retargeting campaigns based on recent behavior.': 'Publikum klar til retargeting-kampagner baseret på nylig adfærd.',
    'STX Premium Drop-offs': 'STX Premium Fraflytninger',
    'Export': 'Eksporter',
    '100% Milestone Reached': '100% milepæl nået',
    'Website → Configurator Entry': 'Websted → Konfiguratorindgang',
    'Graduation Cap Entry': 'Studenterhue-indgang',
    'Studywear Entry': 'Studietøj-indgang',
    // Conversion
    'Conversion Intelligence': 'Konverterings-intelligens',
    'Conversion rates segmented by audience attributes': 'Konverteringsrater segmenteret efter publikumsattributter',
    'Conversion by Education Type': 'Konvertering efter uddannelsestype',
    'Premium vs Standard Performance': 'Premium vs Standard præstation',
    'Conversion by Product Category': 'Konvertering efter produktkategori',
    'Graduation Cap': 'Studenterhue',
    'Studywear': 'Studietøj',
    'Conversion Insights': 'Konverteringsindsigt',
    'Based on the data,': 'Baseret på data,',
    'packages typically convert at a higher rate than Standard packages. Consider offering targeted upsells to the STX demographic.': 'pakker konverterer typisk med en højere rate end Standard-pakker. Overvej at tilbyde målrettede mersalg til STX-demografien.',
    'Target STX Segment': 'Mål STX-segment',
    'Boost Studywear': 'Boost Studietøj',
    // Configurator
    'Configurator Analytics': 'Konfigurator-analyse',
    'Funnel performance, completion rates, and exit points': 'Tragt ydeevne, færdiggørelsesrater og udgangspunkter',
    'Started': 'Startet',
    '25% Done': '25% Færdig',
    '50% Done': '50% Færdig',
    '75% Done': '75% Færdig',
    '100% Done': '100% Færdig',
    'Purchased': 'Købt',
    'Step-by-Step Flow': 'Trin-for-trin flow',
    'Volume Overview': 'Volumenoversigt',
    'Most Common Exit Points': 'Mest almindelige udgangspunkter',
    'of total': 'af total',
    'visitors': 'besøgende',
    'exits': 'afbrydelser',
    'drop': 'frafald',
    // Visitors
    'Visitor Intelligence': 'Besøgsintelligens',
    'Comprehensive directory of all tracked users, sessions, and purchases': 'Omfattende mappe over alle sporede brugere, sessioner og køb',
    // Settings
    'Settings': 'Indstillinger',
  },
  en: {},
};

export const I18nProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('appLang') || 'da');

  useEffect(() => {
    localStorage.setItem('appLang', lang);
  }, [lang]);

  const t = (key) => {
    if (lang === 'en') return key; // English: return key as-is
    return translations[lang]?.[key] || key;
  };

  const formatDate = (dateString, options = {}) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return lang === 'da' ? 'Ugyldig Dato' : 'Invalid Date';
    return d.toLocaleDateString(lang === 'da' ? 'da-DK' : 'en-GB', options);
  };

  const formatTime = (dateString, options = {}) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return lang === 'da' ? 'Ugyldig Tid' : 'Invalid Time';
    return d.toLocaleTimeString(lang === 'da' ? 'da-DK' : 'en-GB', { hour: '2-digit', minute: '2-digit', ...options });
  };

  const formatDateTime = (dateString) => {
    return `${formatDate(dateString)} • ${formatTime(dateString)}`;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t, formatDate, formatTime, formatDateTime }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);

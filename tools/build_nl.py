"""Generate nl/index.html from index.html (English is the source of truth).
Run after every change to index.html:  python3 tools/build_nl.py
Each English string below must occur in index.html; the script stops if one is missing."""
import pathlib, sys
root = pathlib.Path(__file__).resolve().parent.parent
s = (root / "index.html").read_text()

T = [
 ('<html lang="en">', '<html lang="nl">'),
 ('<title>Ramon van den Akker | AI, ML &amp; Optimization Consultant</title>', '<title>Ramon van den Akker | Consultant AI, ML &amp; optimalisatie</title>'),
 ('content="Independent AI, machine learning and optimization consultant in the Netherlands. 15+ years of turning data into better decisions with end-to-end solutions. Available from March 2027."',
  'content="Onafhankelijk consultant AI, machine learning en optimalisatie. Ruim 15 jaar ervaring in het omzetten van data in betere beslissingen, end-to-end van probleem tot productie. Beschikbaar vanaf maart 2027."'),
 ('<meta property="og:locale" content="en_US">\n<meta property="og:locale:alternate" content="nl_NL">', '<meta property="og:locale" content="nl_NL">\n<meta property="og:locale:alternate" content="en_US">'),
 ('<link rel="canonical" href="https://vandenakker.tech/">', '<link rel="canonical" href="https://vandenakker.tech/nl/">'),
 ('<meta property="og:url" content="https://vandenakker.tech/">', '<meta property="og:url" content="https://vandenakker.tech/nl/">'),
 ('content="Ramon van den Akker | Independent AI, Machine Learning &amp; Optimization Consultant"', 'content="Ramon van den Akker | Onafhankelijk consultant AI, machine learning &amp; optimalisatie"'),
 ('content="Independent AI, machine learning and optimization consultant with 15+ years of experience delivering end-to-end solutions. Available from March 2027."',
  'content="Onafhankelijk consultant AI, machine learning en optimalisatie met ruim 15 jaar ervaring in end-to-end-oplossingen. Beschikbaar vanaf maart 2027."'),
 ('aria-label="Sections"', 'aria-label="Secties"'),
 ('<a href="#services">Services</a>', '<a href="#services">Diensten</a>'),
 ('<a href="#experience">Experience</a>', '<a href="#experience">Ervaring</a>'),
 ('<a href="#recommendations">Recommendations</a>', '<a href="#recommendations">Aanbevelingen</a>'),
 ('<a class="nav-keep" href="research/index.html">Research</a>', '<a class="nav-keep" href="research/index.html" hreflang="en">Onderzoek</a>'),
 ('<span class="lang"><strong aria-current="true">EN</strong><span class="sep" aria-hidden="true">|</span><a href="nl/index.html" hreflang="nl" lang="nl">NL</a></span>',
  '<span class="lang"><a href="index.html" hreflang="en" lang="en">EN</a><span class="sep" aria-hidden="true">|</span><strong aria-current="true">NL</strong></span>'),
 ('<p class="badge">Available from March 2027</p>', '<p class="badge">Beschikbaar vanaf maart 2027</p>'),
 ('<p class="tagline">Independent AI, Machine Learning &amp; Optimization Consultant</p>', '<p class="tagline">Onafhankelijk consultant AI, machine learning &amp; optimalisatie</p>'),
 ('''<p class="lede">I have 15+ years of experience using AI, machine learning and optimization to turn data into
        better decisions, and delivering end-to-end solutions, from problem framing to production. I combine
        research-level rigor with pragmatic, production-focused delivery. I have worked in aviation, energy, banking, insurance, housing, the public sector and e-commerce.</p>''',
  '''<p class="lede">Al ruim 15 jaar zet ik AI, machine learning en optimalisatie in om van data betere beslissingen
        te maken, en lever ik end-to-end-oplossingen: van probleemdefinitie tot productie. Ik combineer wetenschappelijke
        grondigheid met een pragmatische, op productie gerichte aanpak. Ik werkte in de luchtvaart,
        de energiesector, het bankwezen, verzekeringen, de woningsector, de publieke sector en e-commerce.</p>'''),
 ('<p class="clients">Recent clients include <strong>Schiphol</strong>, the <strong>Ministry of Defence</strong>,',
  '<p class="clients">Recente opdrachtgevers zijn onder meer <strong>Schiphol</strong>, het <strong>Ministerie van Defensie</strong>,'),
 ('<strong>Just Eat Takeaway.com</strong> and <strong>ANWB Energie</strong>.</p>', '<strong>Just Eat Takeaway.com</strong> en <strong>ANWB Energie</strong>.</p>'),
 ('<h2 id="recommendations-title" class="visually-hidden">What colleagues say</h2>', '<h2 id="recommendations-title" class="visually-hidden">Wat collega\'s zeggen</h2>'),
 ('<p class="facts">Netherlands (remote/hybrid)</p>', '<p class="facts">Nederland (remote/hybride)</p>'),
 ('>Get in touch</a>', '>Neem contact op</a>'),
 ('>LinkedIn profile</a>', '>LinkedIn-profiel</a>'),
 ('<h2 id="expertise-title">Main areas</h2>', '<h2 id="expertise-title">Hoofdgebieden</h2>'),
 ('<li>Causal inference &amp; experimentation</li>', '<li>Causal inference &amp; experimenten</li>'),
 ('<li>Optimization &amp; operations research</li>', '<li>Optimalisatie &amp; operations research</li>'),
 ('<p class="eyebrow">Services</p>', '<p class="eyebrow">Diensten</p>'),
 ('<h2 id="services-title">How I can help</h2>', '<h2 id="services-title">Wat ik voor je kan doen</h2>'),
 ('<figcaption class="viz-caption">Probabilistic 15-minute grid load forecast: actual load, p50 forecast and 50%/90% bands that widen with lead time.</figcaption>', '<figcaption class="viz-caption">Probabilistische voorspelling van de netbelasting per kwartier: gemeten belasting, p50-voorspelling en 50%/90%-banden die breder worden met de horizon.</figcaption>'),
 ('<h3>Projects &amp; interim roles</h3>', '<h3>Projecten &amp; interimopdrachten</h3>'),
 ('<p>Hands-on delivery as data scientist, ML/AI engineer or lead, independently or inside your product or DevOps team.</p>',
  '<p>Hands-on uitvoering als data scientist, ML/AI engineer of lead, zelfstandig of binnen je product- of DevOps-team.</p>'),
 ('<li>Forecasting, optimization and decision support</li>', '<li>Forecasting, optimalisatie en beslisondersteuning</li>'),
 ('<li>Pricing and experimentation</li>', '<li>Pricing en experimenten</li>'),
 ('<li>GenAI and AI engineering</li>', '<li>GenAI en AI engineering</li>'),
 ('<li>Greenfield projects, from idea to production</li>', '<li>Greenfield-projecten, van idee tot productie</li>'),
 ('<figcaption class="viz-caption">Causal graph: the effect of a promotion on revenue, with a backdoor path through season that is closed by adjusting for season.</figcaption>', '<figcaption class="viz-caption">Causale graaf: het effect van een promotie op de omzet, met een backdoor-pad via het seizoen dat wordt gesloten door voor het seizoen te corrigeren.</figcaption>'),
 ('<h3>Consultancy &amp; model review</h3>', '<h3>Advies &amp; modelreview</h3>'),
 ('<p>An independent, senior view on models and plans before they cost you time or money.</p>',
  '<p>Een onafhankelijke, senior blik op modellen en plannen, voordat ze je tijd of geld kosten.</p>'),
 ('<li>Independent review of models: methodology, code and deployment</li>', '<li>Onafhankelijke review van modellen: methodologie, code en deployment</li>'),
 ('<li>Advice at the start of projects and use cases</li>', '<li>Advies bij de start van projecten en use cases</li>'),
 ('<li>Data and ML architecture</li>', '<li>Data- en ML-architectuur</li>'),
 ('<figcaption class="viz-caption">Causal machine learning: estimated individual treatment effects across two features, and the resulting uplift curve above random targeting.</figcaption>', '<figcaption class="viz-caption">Causal machine learning: geschatte individuele behandeleffecten over twee kenmerken, en de bijbehorende uplift-curve boven willekeurige selectie.</figcaption>'),
 ('<p>Courses and workshops for data science teams and professionals, taught by a part-time associate professor at Tilburg University.</p>',
  '<p>Cursussen en workshops voor data science-teams en professionals, gegeven door een parttime universitair hoofddocent aan Tilburg University.</p>'),
 ('<li>Data science and machine learning</li>', '<li>Data science en machine learning</li>'),
 ('<li>Generative AI and LLMs</li>', '<li>Generative AI en LLM\'s</li>'),
 ('<li>Time series and forecasting</li>', '<li>Tijdreeksen en forecasting</li>'),
 ('<li>Experimentation and causal inference</li>', '<li>Experimenten en causal inference</li>'),
 ('<p class="eyebrow">Selected experience</p>', '<p class="eyebrow">Geselecteerde ervaring</p>'),
 ('<h2 id="experience-title">Recent clients and roles</h2>', '<h2 id="experience-title">Recente opdrachtgevers en rollen</h2>'),
 ('Aviation | 2026 – present', 'Luchtvaart | 2026 – heden'),
 ('<p>Forecasting, planning and simulation of passenger flows: production ML models and decision-making under uncertainty.</p>',
  '<p>Forecasting, planning en simulatie van passagiersstromen: ML-modellen in productie en besluitvorming onder onzekerheid.</p>'),
 ('Ministry of Defence<span class="meta">Public sector | 2025 – present', 'Ministerie van Defensie<span class="meta">Publieke sector | 2025 – heden'),
 ('<p>AI engineer for a GenAI solution on Azure in which AI agents extract structured business rules from legal documents.</p>',
  '<p>AI engineer voor een GenAI-oplossing op Azure waarin AI-agents gestructureerde bedrijfsregels uit juridische documenten halen.</p>'),
 ('Energy | 2025 – 2026', 'Energie | 2025 – 2026'),
 ('<p>Short-term forecasting for sourcing and trading on the day-ahead, intraday and ex-post markets, including the data and ML engineering.</p>',
  '<p>Kortetermijnvoorspellingen voor inkoop en handel op de day-ahead-, intraday- en ex-postmarkten, inclusief de data- en ML-engineering.</p>'),
 ('Insurance | 2024 – 2025', 'Verzekeringen | 2024 – 2025'),
 ('<p>Advisor and trainer to the data science team on forecasting, LLMs, contextual bandits and experimentation.</p>',
  '<p>Adviseur en trainer van het data science-team op het gebied van forecasting, LLM\'s, contextual bandits en experimenten.</p>'),
 ('Energy | 2024 – 2025', 'Energie | 2024 – 2025'),
 ('<p>Agentic text-to-SQL and organization-wide chatbots for the LLM Center of Excellence.</p>',
  '<p>Agentic text-to-SQL en organisatiebrede chatbots voor het LLM Center of Excellence.</p>'),
 ('Housing | 2023 – 2024', 'Wonen | 2023 – 2024'),
 ('<p>Led the data science team: predictive models, RAG chatbots and MLOps practices.</p>',
  '<p>Gaf leiding aan het data science-team: voorspelmodellen, RAG-chatbots en MLOps.</p>'),
 ('Energy | 2022 – 2023', 'Energie | 2022 – 2023'),
 ('<p>Large-scale short-term load forecasting for grid congestion management.</p>',
  '<p>Grootschalige kortetermijnvoorspellingen van netbelasting voor congestiemanagement.</p>'),
 ('<p>Global order forecasting, experimentation with interference, and dynamic delivery-fee pricing with contextual bandits.</p>',
  '<p>Wereldwijde ordervoorspellingen, experimentontwerp bij interferentie en dynamische prijsstelling van bezorgkosten met contextual bandits.</p>'),
 ('Finance | 2021 – 2022, 2025', 'Financiële sector | 2021 – 2022, 2025'),
 ('<p>Credit-scoring models and data pipelines, and an improvement plan and target architecture for the scoring engines.</p>',
  '<p>Kredietscoremodellen en datapipelines, en een verbeterplan en doelarchitectuur voor de score-engines.</p>'),
 ('Banking | 2015 – 2021', 'Bankwezen | 2015 – 2021'),
 ("<p>Principal Data Scientist: led MILP-based mortgage RoboAdvice and ML for marketing and credit risk, and founded the bank's data science community.</p>",
  '<p>Principal Data Scientist: leidde hypotheek-RoboAdvice op basis van MILP en ML voor marketing en kredietrisico, en richtte de data science-community van de bank op.</p>'),
  ('<p class="eyebrow">Recommendations</p>', '<p class="eyebrow">Aanbevelingen</p>'),
 ('>Read all recommendations on LinkedIn</a>', '>Alle aanbevelingen op LinkedIn</a>'),
 ("<h2 id=\"contact-title\" class=\"contact-title\">Planning a project for 2027? Let's talk.</h2>",
  '<h2 id="contact-title" class="contact-title">Project gepland voor 2027? Laten we kennismaken.</h2>'),
 ('KvK 82050465<span class="sep" aria-hidden="true">|</span>Netherlands</p>', 'KvK 82050465<span class="sep" aria-hidden="true">|</span>Nederland</p>'),
 ('<a href="research/index.html">Research</a><span class="sep" aria-hidden="true">|</span><a href="#top">Back to top</a>',
  '<a href="research/index.html" hreflang="en">Onderzoek (EN)</a><span class="sep" aria-hidden="true">|</span><a href="#top">Naar boven</a>'),
]
missing = [a[:70] for a, b in T if a not in s]
if missing:
    sys.exit("build_nl: these English strings were not found in index.html:\n  " + "\n  ".join(missing))
for a, b in T:
    s = s.replace(a, b)
# paths: nl/ lives one level deeper
for attr in ('href="', 'src="', 'srcset="'):
    for p in ('assets/', 'research/', 'favicon.svg'):
        s = s.replace(attr + p, attr + '../' + p)
s = s.replace('href="index.html" hreflang="en" lang="en"', 'href="../index.html" hreflang="en" lang="en"')
(root / "nl").mkdir(exist_ok=True)
(root / "nl" / "index.html").write_text(s)
print("nl/index.html written")

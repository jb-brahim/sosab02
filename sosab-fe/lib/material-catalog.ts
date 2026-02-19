export interface MaterialEntry {
    name: string
    unit: string
}

export interface MaterialClassification {
    classification: string
    items: MaterialEntry[]
}

export const MATERIAL_CATALOG: MaterialClassification[] = [
    {
        classification: "BÉTON",
        items: [
            { name: "Béton HRS dosé 150kg/m³ Pompé", unit: "m³" },
            { name: "Béton HRS dosé 200kg/m³ Pompé", unit: "m³" },
            { name: "Béton HRS dosé 250kg/m³ Pompé", unit: "m³" },
            { name: "Béton HRS dosé 300kg/m³ Pompé", unit: "m³" },
            { name: "Béton HRS dosé 350kg/m³ Pompé", unit: "m³" },
            { name: "Béton HRS dosé 400kg/m³ Pompé", unit: "m³" },
            { name: "Béton CPA dosé 150kg/m³ Pompé", unit: "m³" },
            { name: "Béton CPA dosé 200kg/m³ Pompé", unit: "m³" },
            { name: "Béton CPA dosé 250kg/m³ Pompé", unit: "m³" },
            { name: "Béton CPA dosé 300kg/m³ Pompé", unit: "m³" },
            { name: "Béton CPA dosé 350kg/m³ Pompé", unit: "m³" },
            { name: "Béton CPA dosé 400kg/m³ Pompé", unit: "m³" },
            { name: "Béton HRS dosé 150kg/m³ non Pompé", unit: "m³" },
            { name: "Béton HRS dosé 200kg/m³ non Pompé", unit: "m³" },
            { name: "Béton HRS dosé 250kg/m³ non Pompé", unit: "m³" },
            { name: "Béton HRS dosé 300kg/m³ non Pompé", unit: "m³" },
            { name: "Béton HRS dosé 350kg/m³ non Pompé", unit: "m³" },
            { name: "Béton HRS dosé 400kg/m³ non Pompé", unit: "m³" },
            { name: "Béton CPA dosé 150kg/m³ non Pompé", unit: "m³" },
            { name: "Béton CPA dosé 200kg/m³ non Pompé", unit: "m³" },
            { name: "Béton CPA dosé 250kg/m³ non Pompé", unit: "m³" },
            { name: "Béton CPA dosé 300kg/m³ non Pompé", unit: "m³" },
            { name: "Béton CPA dosé 350kg/m³ non Pompé", unit: "m³" },
            { name: "Béton CPA dosé 400kg/m³ non Pompé", unit: "m³" },
        ],
    },
    {
        classification: "LIANTS",
        items: [
            { name: "Ciment HRS en sacs", unit: "T" },
            { name: "Ciment CPA en sacs", unit: "T" },
            { name: "Ciment normal en sacs", unit: "T" },
            { name: "Chaux hydraulique en sacs", unit: "T" },
        ],
    },
    {
        classification: "PRODUITS DE CARRIERE",
        items: [
            { name: "Sable ordinaire", unit: "m³" },
            { name: "Sable lavé", unit: "m³" },
            { name: "Terre végétale", unit: "m³" },
            { name: "Gravier 5/8, 8/12, 4/15 et 8/16", unit: "m³" },
            { name: "Gravier 12/20 et 15/25", unit: "m³" },
            { name: "Gravier 20/40 et 25/40", unit: "m³" },
            { name: "Tout venant 0/20", unit: "m³" },
            { name: "Tuff", unit: "m³" },
        ],
    },
    {
        classification: "PRODUITS ROUGE ET ARMATURE",
        items: [
            { name: "Brique platrière", unit: "U" },
            { name: "Brique 12 trous", unit: "U" },
            { name: "Hourdis de 16", unit: "U" },
            { name: "Brique de 8", unit: "U" },
            { name: "Acier de 6", unit: "T" },
            { name: "Acier HA 8,10,12,14,16,20", unit: "T" },
            { name: "treillis soudés 4 15X15", unit: "m²" },
            { name: "treillis soudés 4 20X20", unit: "m²" },
            { name: "treillis soudés 5 15X15", unit: "m²" },
            { name: "treillis soudés 5 20X20", unit: "m²" },
            { name: "treillis soudés 6 15X15", unit: "m²" },
            { name: "treillis soudés 6 20X20", unit: "m²" },
            { name: "treillis soudés 8 15X15", unit: "m²" },
            { name: "treillis soudés 8 20X20", unit: "m²" },
        ],
    },
    {
        classification: "ETANCHEITE ET PRODUITS BITUMINEUX",
        items: [
            { name: "Chébidex SP44 - Rouleau de 10 m²", unit: "m²" },
            { name: "Derbigum SP4 - Rouleau de 10 m²", unit: "m²" },
            { name: "Derbigum - Sceau de 15 Kgs", unit: "kg" },
            { name: "NARDYL SEAU DE 18KG DERBIGUM", unit: "kg" },
            { name: "Bitume", unit: "kg" },
        ],
    },
    {
        classification: "BOIS ET DERIVES",
        items: [
            { name: "Bois blanc", unit: "m²" },
            { name: "Bois rouges (1er choix)", unit: "m²" },
            { name: "Planche 23mm X 4m", unit: "m²" },
            { name: "Contreplaqués 4mm", unit: "m²" },
            { name: "Contreplaqués 5mm", unit: "m²" },
            { name: "Bastin", unit: "m³" },
            { name: "Panello 3,00X0,50 m ep 2,7cm", unit: "m²" },
            { name: "Panello 2,00X0,50 m ep 2,7cm", unit: "m²" },
            { name: "Panneau stratifié 18 mm", unit: "m²" },
            { name: "Panneau stratifié 15 mm", unit: "m²" },
            { name: "entretoise 20==>40 cm", unit: "U" },
            { name: "Bras 50 cm", unit: "U" },
            { name: "Coin type A 17 cm", unit: "U" },
            { name: "Papillons", unit: "U" },
            { name: "Tige fileté", unit: "ml" },
            { name: "Forreau en PVC", unit: "ml" },
            { name: "Panneau métallique", unit: "m²" },
            { name: "Cale", unit: "U" },
            { name: "Etais métallique 4m", unit: "U" },
            { name: "Fourche", unit: "U" },
            { name: "Sabot", unit: "U" },
            { name: "Sapine 850", unit: "U" },
            { name: "Ratrappage", unit: "U" },
            { name: "Sapine 450", unit: "U" },
        ],
    },
    {
        classification: "BORDURES ET PAVES",
        items: [
            { name: "Bordure mince P2", unit: "ml" },
            { name: 'Bordure de trottoir type "T2"', unit: "ml" },
            { name: 'Bordure de trottoir type "T3"', unit: "ml" },
            { name: 'Caniveau latéral "CS"', unit: "ml" },
            { name: 'Caniveau central "CC"', unit: "ml" },
            { name: "Pavés autobloquants gris", unit: "m²" },
            { name: "Pavés autobloquants rouge", unit: "m²" },
        ],
    },
    {
        classification: "REVETEMENTS",
        items: [
            { name: "Marbre local Ep 2cm", unit: "m²" },
            { name: "Marbre local Ep 3cm", unit: "m²" },
            { name: "Marbre blanc importé Ep 2cm", unit: "m²" },
            { name: "Marbre blanc importé Ep 3cm", unit: "m²" },
            { name: "Plinthe lustré locale", unit: "ml" },
            { name: "Carreaux granito mosaique ordinaire 25X25", unit: "m²" },
            { name: "Carreaux granitos marbré Local 25X25", unit: "m²" },
            { name: "Faience blanc doremail 20X50", unit: "m²" },
            { name: "Faience coloré doremail 20X50", unit: "m²" },
        ],
    },
    {
        classification: "REGARD",
        items: [
            { name: "Regard de visite 80 E 15 cm", unit: "U" },
            { name: "Dalle regard de visite 80", unit: "U" },
            { name: "Rehausse regard de visite 80", unit: "U" },
        ],
    },
    {
        classification: "PRODUIT SIKA",
        items: [
            { name: "Sika ceram 100", unit: "kg" },
            { name: "Sika ceram 105", unit: "kg" },
            { name: "Sika top 121 10,7 kg", unit: "U" },
            { name: "Sika top 209 réservoir 38 kg", unit: "U" },
            { name: "Sika latex", unit: "L" },
            { name: "Sika Flex 11pro FC 300 ml", unit: "U" },
            { name: "Sika dur 30 colle", unit: "U" },
            { name: "Anchrofix", unit: "U" },
        ],
    },
    {
        classification: "DIVERS",
        items: [
            { name: "Grillage en plastique", unit: "m²" },
            { name: "Polystyrène ep 2cm", unit: "m²" },
            { name: "Polystyrène ep 4cm densité 20", unit: "m²" },
            { name: "Joint water stop type O 22", unit: "ml" },
            { name: "Film en polyane", unit: "m²" },
            { name: "Fond de joint Ø 20 mm", unit: "ml" },
            { name: "Carojoint", unit: "kg" },
            { name: "Join croisillons", unit: "U" },
            { name: "Couvre joint en aluminum", unit: "ml" },
            { name: "Chape dur", unit: "kg" },
            { name: "Grillage métallique", unit: "m²" },
        ],
    },
    {
        classification: "TUYAUX PVC",
        items: [
            { name: "Tube PVC diam 32 ep 1,8mm", unit: "ml" },
            { name: "Tube PVC diam 32 ep 3mm", unit: "ml" },
            { name: "Tube PVC diam 40 ep 3mm", unit: "ml" },
            { name: "Tube PVC diam 50 ep 3mm", unit: "ml" },
            { name: "Tube PVC diam 63 ep 3mm", unit: "ml" },
            { name: "Tube PVC diam 75 ep 3mm", unit: "ml" },
            { name: "Tube PVC diam 75 ep 1,8mm", unit: "ml" },
            { name: "Tube PVC diam 100 ep 1,8mm", unit: "ml" },
            { name: "Tube PVC diam 100 ep 3mm", unit: "ml" },
            { name: "Tube PVC diam 110 ep 3,2mm", unit: "ml" },
            { name: "Tube PVC diam 110 ep 3mm", unit: "ml" },
            { name: "Tube PVC diam 125 ep 3mm", unit: "ml" },
            { name: "Tube PVC diam 140 ep 3mm", unit: "ml" },
            { name: "Tube PVC diam 160 ep 2,8mm", unit: "ml" },
            { name: "Tube PVC diam 160 ep 3,2mm", unit: "ml" },
            { name: "Tube PVC diam 200 ep 3,2mm", unit: "ml" },
            { name: "Tube PVC diam 200 ep 3,8mm", unit: "ml" },
            { name: "Tube PVC diam 250 ep 4,4mm", unit: "ml" },
            { name: "Tube PVC diam 250 ep 6,2mm", unit: "ml" },
            { name: "tube gorge diam 50", unit: "m" },
        ],
    },
]

export const ALL_CLASSIFICATION_NAMES = MATERIAL_CATALOG.map((c) => c.classification)

export function getClassification(name: string): MaterialClassification | undefined {
    return MATERIAL_CATALOG.find(
        (c) => c.classification.toLowerCase() === name.toLowerCase()
    )
}

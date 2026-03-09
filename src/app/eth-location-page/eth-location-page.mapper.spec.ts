import { mapETHorama, mapGeoTopics, mapGeoPoi, mapIdentifierResponseToQid, mapWikidata, mapMaps } from './eth-location-page.mapper';


describe('eth-location-page.mapper', () => {
  const ctx = { lang: 'de', vid: 'VID', tab: 'TAB', scope: 'SCOPE' };

  it('maps ETHorama response to links', () => {
    const resp = {
      items: [{ id: '1', name: { de: 'Ort', en: 'Place' } }]
    } as any;

    const result = mapETHorama(resp, ctx);

    expect(result?.links.length).toBe(1);
    expect(result?.links[0].text).toBe('Ort');
    expect(result?.links[0].url).toContain('/de/orte/1');
  });


  it('skips nameless ETHorama entries and falls back to german names in english mode', () => {
    const resp = {
      items: [
        { id: '1', name: { de: 'Ort' } },
        { id: '2', name: {} }
      ]
    } as any;

    const result = mapETHorama(resp, { ...ctx, lang: 'en' });

    expect(result?.links.length).toBe(1);
    expect(result?.links[0].url).toContain('/en/locations/1');
    expect(result?.links[0].text).toBe('Ort');
  });

  it('maps geo topics to search links', () => {
    const resp = {
      features: [{ properties: { name: 'Topic A', gnd: '123' } }]
    } as any;

    const result = mapGeoTopics(resp, ctx);

    expect(result?.length).toBe(1);
    expect(result?.[0].name).toBe('Topic A');
    expect(result?.[0].url).toContain('query=sub,contains,Topic%20A');
  });


  it('maps geo poi dossiers and routes', () => {
    const resp = {
      features: [{
        properties: {
          dossiers: [{ id: 'd1', title_de: 'Dossier', title_en: 'Dossier EN' }],
          routes: [{ id: 'r1', title_de: 'Route', title_en: 'Route EN' }]
        }
      }]
    } as any;

    const result = mapGeoPoi(resp, ctx);

    expect(result?.dossiers.length).toBe(1);
    expect(result?.routes.length).toBe(1);
    expect(result?.dossiers[0].url).toContain('/de/themen/d1');
    expect(result?.routes[0].url).toContain('/de/reisen/r1');
  });


  it('prefers english texts for geo poi dossiers and routes', () => {
    const resp = {
      features: [{
        properties: {
          dossiers: [{ id: 'd1', title_de: 'Dossier', title_en: 'Dossier EN' }],
          routes: [{ id: 'r1', title_de: 'Route', title_en: 'Route EN' }]
        }
      }]
    } as any;

    const result = mapGeoPoi(resp, { ...ctx, lang: 'en' });

    expect(result?.dossiers[0].text).toBe('Dossier EN');
    expect(result?.dossiers[0].url).toContain('/en/topics/d1');
    expect(result?.routes[0].text).toBe('Route EN');
    expect(result?.routes[0].url).toContain('/en/routes/r1');
  });
  

  it('maps identifier response to qid', () => {
    const resp = { results: { bindings: [{ qid: { value: 'Q123' } }] } } as any;

    const result = mapIdentifierResponseToQid(resp);

    expect(result).toBe('Q123');
  });


  it('returns null when identifier response has no bindings', () => {
    const result = mapIdentifierResponseToQid({ results: { bindings: [] } } as any);

    expect(result).toBeNull();
  });


  it('maps wikidata response to view model', () => {
    const resp = {
      results: {
        bindings: [{
          itemLabel: { value: 'Zurich' },
          itemDescription: { value: 'City' },
          item: { value: 'https://www.wikidata.org/entity/Q72' },
          coordinate_location: { value: 'Point(8.55 47.37)' }
        }]
      }
    } as any;

    const result = mapWikidata(resp);

    expect(result?.name).toBe('Zurich');
    expect(result?.description).toBe('City');
    expect(result?.coordinates).toBe('Point(8.55 47.37)');
    expect(result?.links?.length).toBeGreaterThan(0);
  });


  it('adds optional wikidata links when identifiers exist', () => {
    const resp = {
      results: {
        bindings: [{
          itemLabel: { value: 'Zurich' },
          item: { value: 'https://www.wikidata.org/entity/Q72' },
          wikipedia: { value: 'https://de.wikipedia.org/wiki/Z%C3%BCrich' },
          geonames: { value: '123' },
          gnd: { value: '456' }
        }]
      }
    } as any;

    const result = mapWikidata(resp);

    expect(result?.links?.map(l => l.text)).toContain('Wikipedia');
    expect(result?.links?.map(l => l.text)).toContain('Geonames');
    expect(result?.links?.map(l => l.text)).toContain('GND');
  });


  it('returns null when wikidata response is empty', () => {
    const result = mapWikidata({ results: { bindings: [] } } as any);

    expect(result).toBeNull();
  });
  

  it('maps maps response and normalizes urls', () => {
    const resp = {
      features: [{
        properties: {
          title: 'Map A',
          url: 'example.com/map',
          description: 'Desc',
          source: 'e-maps'
        }
      }]
    } as any;

    const result = mapMaps(resp);

    expect(result?.length).toBe(1);
    expect(result?.[0].url).toBe('https://example.com/map');
    expect(result?.[0].title).toContain('e-maps');
  });


  it('returns null when maps response lacks features and appends attribution/e-rara labels', () => {
    expect(mapMaps({} as any)).toBeNull();

    const resp = {
      features: [{
        properties: {
          title: 'Map B',
          attribution: 'ETH',
          source: 'e-rara',
          url: 'http://example.org',
          description: 'Desc'
        }
      }]
    } as any;

    const result = mapMaps(resp);

    expect(result?.[0].title).toContain('(e-rara)');
    expect(result?.[0].title).toContain('ETH');
    expect(result?.[0].url).toBe('https://example.org');
  });
});

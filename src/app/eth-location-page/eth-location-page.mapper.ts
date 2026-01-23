import { PlacePageContext, EthoramaAPIResponse, GraphGeoInfoAPIResponse, WikiIdentifierForLccnAPIResponse, WikidataPlaceAPIResponse, EthoramaPlaceVM,  GeoTopicVM, GeoPoiVM, WikidataPlaceVM, MapVM } from '../models/eth.model';


// ETHorama
export function mapETHorama( response: EthoramaAPIResponse, ctx: PlacePageContext ): EthoramaPlaceVM | null {
  if (!response?.items?.length) {
    return null;
  }

  const place: EthoramaPlaceVM = {
    qid: ctx.qid,
    contentItems: [],
    links: []
  };

  // deduplicate contentItems
  response.items.forEach(item => {
    item.contentItems?.forEach(ci => {
      if (!place.contentItems.some(x => x.docId === ci.docId)) {
        place.contentItems.push(ci);
      }
    });
  });

  // links
  response.items.forEach(item => {
    const name =
      ctx.lang === 'en'
        ? item.name?.en || item.name?.de
        : item.name?.de;
    if (!name) return;

    place.links.push({
      url:
        ctx.lang === 'en'
          ? `https://ethorama.library.ethz.ch/en/locations/${item.id}`
          : `https://ethorama.library.ethz.ch/de/orte/${item.id}`,
      text: name
    });
  });

  return place;
}

// Geodata Graph Topics
export function mapGeoTopics( response: GraphGeoInfoAPIResponse, ctx: PlacePageContext): GeoTopicVM[] | null {
  if (!response?.features?.length) {
    return null;
  }
  // todo only what is used
  return response.features
    .filter(f => f.properties)  
    .map(f => {
      const p = f.properties!;
      return {
        name: p.name,
        gnd: p.gnd,
        url: `/search?query=sub,contains,${encodeURIComponent(p.name)}&tab=${ctx.tab}&search_scope=${ctx.scope}&vid=${ctx.vid}&lang=${ctx.lang}&mode=advanced`,
        eMaps: (p.eMaps ?? []).map(i => ({
          mmsid: i.mmsid,
          title: i.title,
          url: `/fulldisplay?vid=${ctx.vid}&docid=alma${i.mmsid}`
        })),
        eRaraItems: (p.eRaraItems ?? []).map(i => ({
          mmsid: i.mmsid,
          title: i.title,
          url: `/fulldisplay?vid=${ctx.vid}&docid=alma${i.mmsid}`
        }))
      };
    });
}


// Geodata Graph POI
export function mapGeoPoi( response: GraphGeoInfoAPIResponse, ctx: PlacePageContext): GeoPoiVM | null {
  if (!response?.features?.length) {
    return null;
  }

  const poi: GeoPoiVM = {
    dossiers: [],
    routes: []
  };

  response.features.forEach(f => {
    f.properties?.dossiers?.forEach(i => {
    const text =
      ctx.lang === 'en'
        ? i.title_en ?? i.title_de ?? ''
        : i.title_de ?? '';

      poi.dossiers.push({
        text,
        url:
          ctx.lang === 'en'
            ? `https://ethorama.library.ethz.ch/en/topics/${i.id}`
            : `https://ethorama.library.ethz.ch/de/themen/${i.id}`
      });
    });

    f.properties?.routes?.forEach(i => {
      const text =
        ctx.lang === 'en'
          ? i.title_en ?? i.title_de ?? ''
          : i.title_de ?? '';

      poi.routes.push({
        text,
        url:
          ctx.lang === 'en'
            ? `https://ethorama.library.ethz.ch/en/routes/${i.id}`
            : `https://ethorama.library.ethz.ch/de/reisen/${i.id}`
      });
    });
  });

  return poi;
}

// Identifier Response from Wikidata -> QID
export function mapIdentifierResponseToQid( response: WikiIdentifierForLccnAPIResponse): string | null {
  const binding = response?.results?.bindings?.[0];
  if (!binding) {
    return null;
  }  
  return binding.qid?.value ?? null;
}

// Wikidata
export function mapWikidata( response: WikidataPlaceAPIResponse): WikidataPlaceVM | null {
  const binding = response?.results?.bindings?.[0];
  if (!binding) {
    return null;
  }

  const place: WikidataPlaceVM = {
    name: binding.itemLabel?.value || '',
    description: binding.itemDescription?.value,
    image: binding.image?.value ?? null,
    image_page: binding.image?.value?.replace('/Special:FilePath/','/file:') ?? null,    
    coordinates: binding?.coordinate_location?.value,
    links: []
  };

  if (binding.item?.value) {
    place.links.push({ text: 'Wikidata', url: binding.item.value });
  }
  if (binding.wikipedia?.value) {
    place.links.push({ text: 'Wikipedia', url: binding.wikipedia.value });
  }
  if (binding.geonames?.value) {
    place.links.push({
      text: 'Geonames',
      url: `https://www.geonames.org/${binding.geonames.value}`
    });
  }
  if (binding.gnd?.value) {
    place.links.push({
      text: 'GND',
      url: `http://d-nb.info/gnd/${binding.gnd.value}`
    });
  }

  return place;
}

// Maps
export function mapMaps( filteredData: GraphGeoInfoAPIResponse): MapVM[] | null {
  if(!filteredData.features)return null;
  const maps = filteredData?.features.map( (f:any) => {
    let title = f.properties.title;
    if (f.properties.attribution){
      title += ' ,' + f.properties.attribution;                  
    }
    if (f.properties?.source === 'e-maps'){
        title += ' ' +  '(e-maps, georeferenced)';
    }
    else if(f.properties?.source === 'e-rara'){
        title += ' ' +  '(e-rara)';
    }
    let url = null;
    if(f.properties.url){
      url = f.properties.url;
      url = url.replace('http://', '');
      if(url.indexOf('https://') === -1){
          url = 'https://' + url;
      }
    }
    return {
      'url': url,
      'title': title,
      'description':f.properties.description                  
    }
  }) 
  return maps;
}

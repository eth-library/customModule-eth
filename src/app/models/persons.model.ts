export type Persons = {
    name: string,
    resources: {
        link: {
          uri: string
        },
        metadata: {
          first_name: string,
          last_name: string
        },
        provider: {
          slug: string
        }
    }[]
  }[]
  
  export type ApiResults = {
    results: {
        provider: string,
        resp: {
          concordances: Persons
        }
    }[]
  }
  
/**
 * Welcome to Cloudflare Workers! This is your first scheduled worker.
 *
 * - Run `wrangler dev --local` in your terminal to start a development server
 * - Run `curl "http://localhost:8787/cdn-cgi/mf/scheduled"` to trigger the scheduled event
 * - Go back to the console to see what your worker has logged
 * - Update the Cron trigger in wrangler.toml (see https://developers.cloudflare.com/workers/wrangler/configuration/#triggers)
 * - Run `wrangler publish --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/runtime-apis/scheduled-event/
 */

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
}

const someHost = 'https://api.entur.io';
const url = someHost + '/journey-planner/v3/graphql';
const body = {
  query: `{
	quays(ids: ["NSR:Quay:11689", "NSR:Quay:11693"]) {
	  name
	  id
	  description
	  publicCode
	  estimatedCalls(
		timeRange: 1000
		numberOfDeparturesPerLineAndDestinationDisplay: 1
		numberOfDepartures: 10
		whiteListedModes: bus
	  ) {
		destinationDisplay {
		  frontText
		}
		serviceJourney {
		  line {
			publicCode
		  }
		}
		expectedDepartureTime
	  }
	}
  }
  `
};

/**
 * gatherResponse awaits and returns a response body as a string.
 * Use await gatherResponse(..) in an async function to get the response body
 * @param {Response} response
 */
async function gatherResponse(response) {
  const { headers } = response;
  const contentType = headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return JSON.stringify(await response.json());
  } else if (contentType.includes('application/text')) {
    return response.text();
  } else if (contentType.includes('text/html')) {
    return response.text();
  } else {
    return response.text();
  }
}






export default {
	async fetch(request) {
		const init = {
			body: JSON.stringify(body),
			method: 'POST',
			headers: {
			  'content-type': 'application/json;charset=UTF-8',
			},
		  };
		  const response = await fetch(url, init);
		  const results = await gatherResponse(response);
		  let newData = {}
		  const data = JSON.parse(results).data.quays;
		  data.forEach((quay) => {
			quay.estimatedCalls.forEach((call) => {
				let time = new Date(call.expectedDepartureTime);
				let now = new Date();
				let diff = time.getTime() - now.getTime();
				let minutes = Math.floor(diff / 60000);
				let line = call?.serviceJourney?.line?.publicCode;
				
				if (minutes < 0) {
					return;
				}
				
				
				newData[line] = minutes;
								
					
		});
		  
		});
	  
	  return new Response(JSON.stringify(newData), {
		  headers: {
			'content-type': 'application/json;charset=UTF-8',
		  },
		})
	  
	},
  };
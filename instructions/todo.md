## TODO

### API Improvements

1. **Split 'dist' parameter**: Contact the API developer about splitting the current 'dist' parameter into separate 'type' and 'surface' parameters. This will allow for more precise filtering of events.

2. **Add distance/duration range parameters**: Request the addition of two new parameters that can be used for filtering events by distance or duration range (e.g., from 45km to 100km, or from 6h to 24h).

3. **Consistent Error Handling**: Work with the API developer to implement consistent error responses across all endpoints. This will allow for better error handling and user feedback in the front-end application.

4. **Fix JSON response error**: Address the issue where the API returns an incorrectly formatted JSON response when there are no events meeting the specified criteria. The current response looks like: `Warning: Undefined variable $arrHits in <b>/var/customers/webs/duv2/statistik/json/mcalendar.php</b> on line <b>370</b>
"Races":null  `
   It should return a valid JSON response, even when there are no results, such as: `json
{
  "Races": []
}   `

5. **Documentation Updates**: Once the API improvements are implemented, update the API documentation in this PRD to reflect the changes in parameters and response format.

6. **Update API response structure**: The current API response is returning an array of events directly. Request the API developer to update the response structure to include both the events array and the total count of events. The desired structure should be:

   ````json
   {
     "totalEvents": 7757,
     "events": [
       // ... event objects
     ]
   }   ```

   Until this change is implemented, we'll need to use a placeholder calculation for the total number of events.

   ````

7. **Update mgetresultperson.json response**: Request the API developer to include the following additional information in the response:
   - Add `Firstname` and `Lastname` fields to the `PersonHeader` object.
   - Include `Rank` information in the `CompTable` array for each event participation.

### Temporary Workarounds

1. **Single filter for 'dist' parameter**: Update the event filter component to use a single filter that combines distance, duration, and type/surface options, reflecting the current capabilities of the 'dist' parameter in the API.

2. **Handling incorrect JSON responses**: Continue to handle cases where the API returns incorrectly formatted JSON responses when there are no events meeting the specified criteria.

3. **Parsing total events from text**: Currently, we're extracting the total number of events from the `nlsCalendarFoundEvents` text field. This is not ideal and should be replaced with a proper numeric field in the API response when possible.

### UI Improvements

1. **Consistent Date Formats**: Ensure all date formats are consistent across the application, particularly in the DateRangePicker component used in event-filter.tsx.
   - Default to the yyyy-mm-dd format for all date displays and inputs.
   - Consider implementing a user setting to allow users to choose their preferred date format.
   - Update the DateRangePicker and DateInput components to use the chosen format consistently.

### Performance Optimization

#### Preventing Unnecessary Re-renders and Re-fetching

- **Component Rendering**:

  - **Guideline**: Optimize components to prevent unnecessary re-renders and re-fetching of assets.
  - **Implementation**:
    - Use `React.memo` to memoize functional components that do not need to re-render on every state or prop change.
    - Ensure that dependencies in hooks like `useEffect` are correctly specified to avoid infinite loops or unnecessary re-fetches.
    - Avoid anonymous functions and objects in dependencies that can cause re-renders.

- **Asset Caching and Preloading**:
  - **Guideline**: Ensure that assets like images are cached and preloaded to improve performance.
  - **Implementation**:
    - Use the `<Image>` component from `next/image` to leverage built-in optimizations.
    - Preload critical assets when appropriate.

### Handling of Total Pages

- **Current Challenge**:

  - The API does not provide a straightforward way to get the total number of pages or total items, making accurate pagination difficult.

- Suggestion:
  - API Enhancement:
    - Request the API developer to include pagination metadata in the API responses.
    - Include fields like totalItems, totalPages, or itemsPerPage.
  - Benefits:
    - Enables accurate pagination controls.
    - Improves user experience by providing users with information about the total number of available pages.

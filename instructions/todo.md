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
   - Add `PerformanceNumeric` field to allow for easier sorting and comparison of performances.

8. **Standardize date format across all endpoints**:

   - Decide on a standard date format to be used consistently across all API endpoints (e.g., ISO 8601 format: YYYY-MM-DD).
   - Alternatively, consider providing separate fields for day, month, and year to allow for flexible formatting on the client side.
   - Ensure this standardized format is implemented in all relevant API responses, including but not limited to:
     - mgetresultperson.php
     - mcalendar.php
     - Any other endpoints that return date information

9. **Implement pagination metadata**:

   - Add pagination metadata to all endpoints that return lists of items.
   - Include fields such as `totalItems`, `totalPages`, `currentPage`, and `itemsPerPage` in the response.
   - This will allow for more efficient client-side pagination and improve overall performance.

10. **Use consistent naming conventions**:

    - Standardize field names across all endpoints (e.g., use camelCase or snake_case consistently).
    - Ensure that similar data is represented with the same field names across different endpoints.

11. **Implement HATEOAS principles**:

    - Include hyperlinks in API responses to related resources.
    - This will make the API more discoverable and easier to navigate.

12. **Add versioning to the API**:

    - Implement API versioning (e.g., /v1/, /v2/) to allow for future updates without breaking existing integrations.

13. **Implement proper HTTP status codes**:

    - Ensure that appropriate HTTP status codes are used for different scenarios (e.g., 200 for success, 404 for not found, 400 for bad request, etc.).

14. **Add rate limiting**:

    - Implement rate limiting to prevent abuse and ensure fair usage of the API.
    - Include rate limit information in the response headers.

15. **Implement proper CORS headers**:

    - Ensure that proper CORS headers are set to allow secure cross-origin requests.

16. **Add an endpoint for fetching event types**:

    - Create a new endpoint that returns a list of all possible event types.
    - This will allow for dynamic population of event type filters in the frontend.

17. **Implement field selection**:

    - Allow clients to specify which fields they want to be returned in the response.
    - This can help reduce payload size and improve performance for clients that don't need all the data.

18. **Add support for bulk operations**:

    - Implement endpoints that allow for bulk creation, updating, or deletion of resources where applicable.

19. **Implement proper caching headers**:

    - Add appropriate caching headers to responses to improve performance and reduce server load.

20. **Create a comprehensive API documentation**:

    - Develop a detailed API documentation using a standard format like OpenAPI (Swagger).
    - Include examples, all possible parameters, and response formats for each endpoint.

21. **Add event type to mgetresultperson.php endpoint**:
    - Request the API developer to include the event type (e.g., road, trail, track) in the response of the mgetresultperson.php endpoint.
    - This information should be added for each event in the runner's performance history.
    - Including the event type will allow for better filtering and categorization of a runner's performances in the frontend.

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

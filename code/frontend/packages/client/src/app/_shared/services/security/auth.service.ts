import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import createAuth0Client, { GetUserOptions } from '@auth0/auth0-spa-js';
import Auth0Client from '@auth0/auth0-spa-js/dist/typings/Auth0Client';
import {
  BehaviorSubject,
  combineLatest,
  from,
  Observable,
  of,
  throwError,
} from 'rxjs';
import {
  catchError,
  concatMap,
  exhaustMap,
  filter,
  map,
  shareReplay,
  startWith,
  tap,
} from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Create an observable of Auth0 instance of client
  auth0Client$ = (from(
    createAuth0Client({
      domain: 'badvlasim.eu.auth0.com',
      client_id: '2LqkYZMbrTTXEE0OMkQJLmpRrOVQheoF',
      redirect_uri: `${window.location.origin}`,
      audience: `ranking-simulation`,
    })
  ) as Observable<Auth0Client>).pipe(
    shareReplay(1), // Every subscription receives the same shared value
    catchError((err) => throwError(err))
  );
  update$ = new BehaviorSubject(0);

  // Define observables for SDK methods that return promises by default
  // For each Auth0 SDK method, first ensure the client instance is ready
  // concatMap: Using the client instance, call SDK method; SDK returns a promise
  // from: Convert that resulting promise into an observable
  isAuthenticated$ = this.auth0Client$.pipe(
    concatMap((client: Auth0Client) => from(client.isAuthenticated())),
    tap((res) => (this.loggedIn = res))
  );

  handleRedirectCallback$ = this.auth0Client$.pipe(
    concatMap((client: Auth0Client) => from(client.handleRedirectCallback()))
  );
  // Create subject and public observable of user profile data
  private userProfileSubject$ = new BehaviorSubject<any>(null);
  userProfile$ = this.userProfileSubject$.asObservable();
  // Create a local property for login status
  loggedIn: boolean = null;

  userPermissions$: Observable<string[]>;

  constructor(private router: Router, private httpClient: HttpClient) {
    // On initial load, check authentication state with authorization server
    // Set up local auth streams if user is already authenticated
    this.localAuthSetup();
    // Handle redirect from Auth0 login
    this.handleAuthCallback();

    this.setupStreams();
  }

  // When calling, options can be passed if desired
  // https://auth0.github.io/auth0-spa-js/classes/auth0client.html#getuser
  getUser$(options?): Observable<any> {
    return this.auth0Client$.pipe(
      exhaustMap((client: Auth0Client) => from(client.getUser(options))),
      tap((user) => this.userProfileSubject$.next(user))
    );
  }

  private localAuthSetup() {
    // This should only be called on app initialization
    // Set up local authentication streams
    const checkAuth$ = this.isAuthenticated$.pipe(
      concatMap((loggedIn: boolean) => {
        if (loggedIn) {
          // If authenticated, get user and set in app
          // NOTE: you could pass options here if needed
          return this.getUser$();
        }
        // If not authenticated, return stream that emits 'false'
        return of(loggedIn);
      })
    );
    checkAuth$.subscribe();
  }

  login(redirectPath: string = '/') {
    // A desired redirect path can be passed to login method
    // (e.g., from a route guard)
    // Ensure Auth0 client instance exists
    this.auth0Client$.subscribe((client: Auth0Client) => {
      // Call method to log in
      client.loginWithRedirect({
        redirect_uri: `${window.location.origin}`,
        appState: { target: redirectPath },
      });
    });
  }
  private setupStreams() {
    this.userPermissions$ = combineLatest([
      this.userProfile$,
      this.update$,
    ]).pipe(
      filter(([profile]) => profile != null),
      exhaustMap((_) =>
        this.httpClient.get<string[]>(
          `${environment.api}/${environment.apiVersion}/user/permissions`
        )
      ),
      shareReplay(1)
    );
  }

  getUserToken$(options?: GetUserOptions): Observable<string> {
    return this.auth0Client$.pipe(
      exhaustMap((client: Auth0Client) => client.getTokenSilently(options))
    );
  }

  hasClaim$(claim: string): Observable<boolean> {
    return this.userPermissions$.pipe(
      map((userClaims) => this.includes(userClaims, claim))
    );
  }

  hasAllClaims$(claims: string[]): Observable<boolean> {
    return this.userPermissions$.pipe(
      map((userClaims) =>
        claims.reduce(
          (acc, claim) => acc && this.includes(userClaims, claim),
          true
        )
      )
    );
  }

  hasAnyClaims$(claims: string[]): Observable<boolean> {
    return this.userPermissions$.pipe(
      map((userClaims) =>
        claims.reduce(
          (acc, claim) => acc || this.includes(userClaims, claim),
          false
        )
      )
    );
  }

  reloadPermissions() {
    this.update$.next(null);
  }

  private includes(claims: string[], claim: string) {
    if (claim.indexOf('*') >= 0) {
      return claims.find((r) => r.indexOf(claim.replace('*', ''))) !== null;
    } else {
      return claims.includes(claim);
    }
  }

  private handleAuthCallback() {
    // Call when app reloads after user logs in with Auth0
    const params = window.location.search;
    if (params.includes('code=') && params.includes('state=')) {
      let targetRoute: string; // Path to redirect to after login processsed
      const authComplete$ = this.handleRedirectCallback$.pipe(
        // Have client, now call method to handle auth callback redirect
        tap((cbRes) => {
          // Get and set target redirect route from callback results
          targetRoute =
            cbRes.appState && cbRes.appState.target
              ? cbRes.appState.target
              : '/';
        }),
        concatMap(() => {
          // Redirect callback complete; get user and login status
          return combineLatest([this.getUser$(), this.isAuthenticated$]);
        })
      );
      // Subscribe to authentication completion observable
      // Response will be an array of user and login status
      authComplete$.subscribe(([user, loggedIn]) => {
        // Redirect to target route after callback processing
        this.router.navigate([targetRoute]);
      });
    }
  }

  logout() {
    // Ensure Auth0 client instance exists
    this.auth0Client$.subscribe((client: Auth0Client) => {
      // Call method to log out
      client.logout({
        client_id: '2LqkYZMbrTTXEE0OMkQJLmpRrOVQheoF',
        returnTo: `${window.location.origin}`,
      });
    });
  }
}

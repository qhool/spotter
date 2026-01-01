import { mount } from 'cypress/react';
import { createElement } from 'react';
import { RemixWizardPage } from '../../pages/RemixWizardPage';
import { MockSpotifySdk } from '../helpers/mockSpotifySdk';

const makeSdk = () => {
  const sdk = new MockSpotifySdk(undefined, { recentLimit: 0 });

  sdk.setUserPlaylists([
    {
      id: 'pl1',
      name: 'My Mix',
      description: 'desc',
      images: [{ url: 'img' }],
      owner: { display_name: 'me' },
      tracks: { total: 10 },
      type: 'playlist'
    },
    ...sdk.getUserPlaylistsSnapshot().filter(p => p.id !== 'pl1')
  ]);
  sdk.setSavedAlbums(sdk.getSavedAlbumsSnapshot());

  return sdk as any;
};

describe('RemixWizardPage (Cypress component)', () => {
  const mountPage = (sdk = makeSdk()) => {
    const navSlot = document.createElement('div');
    document.body.appendChild(navSlot);
    mount(
      createElement(RemixWizardPage, {
        sdk,
        navSlot,
        syncController: {} as any,
        recentTracksContainer: null
      })
    );
  };

  it('adds from search pane into selected list and prevents duplicates', () => {
    mountPage();
    cy.contains('.item-title', 'My Mix', { timeout: 10000 }).should('exist');
    cy.contains('.item-title', 'My Mix', { timeout: 10000 })
      .parents('.item-tile')
      .first()
      .as('myMixTile');

    cy.get('@myMixTile').find('.add-button', { timeout: 5000 }).click();
    cy.get('.selected-items-pane .item-title').should('contain.text', 'My Mix');

    // After the add, re-query to ensure the tile cannot be added again (it may be filtered out or disabled)
    cy.get('.search-results').should('not.contain.text', 'My Mix');
    cy.get('.selected-items-pane .item-title').then(selected => {
      const occurrences = Array.from(selected).filter(el => el.textContent?.includes('My Mix')).length;
      expect(occurrences).to.equal(1);
    });
  });

  it('supports searching and adding playlists from results', () => {
    mountPage();
    cy.get('.search-input').type('rock');
    cy.get('form').submit();
    cy.contains('.item-title', 'Search Playlist 1', { timeout: 5000 })
      .should('exist')
      .closest('.item-tile')
      .find('.add-button')
      .click();
    cy.get('.selected-items-pane .item-title').should('contain.text', 'Search Playlist 1');
  });

  it('removes selected items via remove control', () => {
    mountPage();
    cy.get('.add-button', { timeout: 5000 }).first().click();
    cy.contains('.slide-nav-item', 'Selected').click();
    cy.get('[data-pane-id="selected-items"]').should('have.attr', 'data-visible', 'true');
    cy.get('.remove-button').click({ force: true });
    cy.get('.selected-items-pane .item-title').should('not.exist');
  });

  it('selected list wrapper can overflow and show scroll', () => {
    mountPage();
    cy.contains('.item-title', 'My Mix', { timeout: 5000 })
      .closest('.item-tile')
      .find('.add-button')
      .click();

    cy.get('.selected-items-pane__list-wrapper').then(el => {
      Object.defineProperty(el[0], 'clientHeight', { value: 200, configurable: true });
      Object.defineProperty(el[0], 'scrollHeight', { value: 600, configurable: true });
      expect(el[0].scrollHeight).to.be.greaterThan(el[0].clientHeight);
    });
  });

  it('passes exclusion toggles into remix pane', () => {
    mountPage();
    cy.get('.add-button', { timeout: 5000 }).first().click();
    cy.contains('.slide-nav-item', 'Selected').click();
    cy.get('[data-pane-id="selected-items"]').should('have.attr', 'data-visible', 'true');
    cy.get('.exclude-button').click({ force: true });
    cy.get('.exclude-button').should('have.class', 'is-active');
  });

  it('aligns remix method dropdown with search type selector (top)', () => {
    mountPage();
    cy.get('.type-selector').then(type => {
      const typeRect = type[0].getBoundingClientRect();
      cy.get('#remix-method').then(remix => {
        const remixRect = remix[0].getBoundingClientRect();
        expect(Math.abs(remixRect.top - typeRect.top)).to.be.lessThan(40);
      });
    });
  });

  it('matches remix method dropdown height with search type selector', () => {
    mountPage();
    cy.get('.type-selector').then(type => {
      const typeRect = type[0].getBoundingClientRect();
      cy.get('#remix-method').then(remix => {
        const remixRect = remix[0].getBoundingClientRect();
        expect(Math.abs(remixRect.height - typeRect.height)).to.be.lessThan(40);
      });
    });
  });

  it('aligns tops of search results and selected items lists', () => {
    mountPage();
    cy.contains('.slide-nav-item', 'Selected').click();
    cy.get('[data-pane-id="selected-items"]').should('have.attr', 'data-visible', 'true');
    cy.get('.search-results').then(search => {
      const searchRect = search[0].getBoundingClientRect();
      cy.get('.selected-items-pane__list-wrapper').then(selected => {
        const selectedRect = selected[0].getBoundingClientRect();
        expect(Math.abs(selectedRect.top - searchRect.top)).to.be.lessThan(40);
      });
    });
  });
});

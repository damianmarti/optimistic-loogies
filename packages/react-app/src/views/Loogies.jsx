import React, { useEffect, useState } from "react";
import { List } from "antd";
import { gql, useQuery } from "@apollo/client";

import "./Loogies.css";
import LoogieCard from "../components/LoogieCard";

function Loogies({ readContracts, mainnetProvider, blockExplorer, totalSupply, DEBUG, serverUrl }) {
  const [allLoogies, setAllLoogies] = useState();
  const [page, setPage] = useState(1);
  const [loadingLoogies, setLoadingLoogies] = useState(true);
  const [after, setAfter] = useState("");
  const [before, setBefore] = useState("");
  const perPage = 48;

  let LOOGIES_GRAPHQL = `
    query Tokens`;

  if (after) {
    LOOGIES_GRAPHQL += `($after: String)`;
  }

  if (before) {
    LOOGIES_GRAPHQL += `($before: String)`;
  }

  LOOGIES_GRAPHQL += ` {
      tokens(orderBy: "idNumber", orderDirection: "desc", limit: 48, `;

  if (after) {
    LOOGIES_GRAPHQL += `after: $after, `;
  }

  if (before) {
    LOOGIES_GRAPHQL += `before: $before, `;
  }

  LOOGIES_GRAPHQL += `where: { kind_in: ["OptimisticLoogie"] }) {
        items {
          id
          tokenURI
          ownerId
        }
        pageInfo {
          startCursor
          endCursor
          hasPreviousPage
          hasNextPage
        }
      }
    }
  `;

  const LOOGIES_GQL = gql(LOOGIES_GRAPHQL);
  const loogiesData = useQuery(LOOGIES_GQL, { variables: { after, before }, pollInterval: 60000 });

  useEffect(() => {
    const updateAllLoogies = async () => {
      setLoadingLoogies(true);
      if (loogiesData && loogiesData.data?.tokens?.items?.length > 0) {
        const collectibleUpdate = [];
        const loogies = loogiesData.data.tokens.items;
        for (let tokenIndex = 0; tokenIndex < loogies.length; tokenIndex++) {
          try {
            const id = loogies[tokenIndex].id;
            const tokenId = id.split(":")[1];
            let tokenURI = loogies[tokenIndex].tokenURI;
            const owner = loogies[tokenIndex].ownerId;
            const jsonManifestString = atob(tokenURI.substring(29));

            try {
              const jsonManifest = JSON.parse(jsonManifestString);
              collectibleUpdate.push({ id, tokenId, owner, ...jsonManifest });
            } catch (e) {
              console.log(e);
            }
          } catch (e) {
            console.log(e);
          }
        }
        console.log("collectibleUpdate", collectibleUpdate);
        setAllLoogies(collectibleUpdate);
      } else {
        console.log("no loogies found");
        setAllLoogies([]);
      }
      setLoadingLoogies(false);
    };
    console.log("useEffect");
    updateAllLoogies();
  }, [loogiesData, page, DEBUG]);

  return (
    <div className="loogies">
      <div style={{ width: "auto", margin: "auto", paddingBottom: 25, minHeight: 800 }}>
        <div>
          <List
            grid={{
              gutter: 16,
              xs: 1,
              sm: 2,
              md: 2,
              lg: 3,
              xl: 4,
              xxl: 6,
            }}
            pagination={{
              total: totalSupply,
              simple: true,
              defaultPageSize: perPage,
              defaultCurrent: page,
              onChange: currentPage => {
                if (currentPage > page) {
                  setAfter(loogiesData.data.tokens.pageInfo.endCursor);
                  setBefore("");
                } else {
                  setAfter("");
                  setBefore(loogiesData.data.tokens.pageInfo.startCursor);
                }
                setPage(currentPage);
              },
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${totalSupply} items`,
            }}
            loading={loadingLoogies}
            dataSource={allLoogies}
            renderItem={item => {
              const id = item.id;

              return (
                <List.Item key={id}>
                  <LoogieCard
                    image={item.image}
                    id={id}
                    name={item.name}
                    description={item.description}
                    owner={item.owner}
                    mainnetProvider={mainnetProvider}
                    blockExplorer={blockExplorer}
                  />
                </List.Item>
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default Loogies;

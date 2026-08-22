import { useCallback, useEffect, useState } from "react";
import api, { readError } from "./api";

export function useFetch(path) {
  const [state, setState] = useState({ data: null, error: "", loading: true });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;

    api
      .get(path)
      .then(({ data }) => active && setState({ data, error: "", loading: false }))
      .catch(
        (error) =>
          active && setState({ data: null, error: readError(error), loading: false })
      );

    return () => {
      active = false;
    };
  }, [path, nonce]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  return { ...state, reload };
}

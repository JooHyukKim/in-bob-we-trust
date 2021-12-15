package com.inbobwetrust.model.entitiy;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Getter
@ToString
@NoArgsConstructor
public class Agency {
    private Long id;
    private String endpoint;

    @Builder
    public Agency(Long id, String endpoint) {
        this.id = id;
        this.endpoint = endpoint;
    }
}

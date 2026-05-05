package com.dacs.fashion.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "vouchers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Voucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long voucherId;

    @Column(nullable = false, unique = true)
    private String code;

    private String discountType;

    private BigDecimal discountValue;

    private BigDecimal minOrderValue;

    private LocalDate startDate;

    private LocalDate endDate;

    private String status;
}